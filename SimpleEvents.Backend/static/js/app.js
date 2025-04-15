const { createApp, ref, computed, onMounted, onUnmounted, reactive } = Vue;

const app = createApp({
    setup() {
        // State
        const timelines = ref([]);
        const selectedTimeline = ref(null);
        const showCreateTimelineModal = ref(false);
        const showEditTimelineModal = ref(false);
        const showDeleteTimelineModal = ref(false);
        const showCreateEventModal = ref(false);
        const showEditEventModal = ref(false);
        const showCreateEventTypeModal = ref(false);
        const showEditEventTypeModal = ref(false);
        const showImportTimelineModal = ref(false);
        const showTimelineView = ref(false);
        const showDeleteEventTypeWarning = ref(false);
        const showDuplicateEventTypeWarning = ref(false);
        const eventTypeSearch = ref('');
        const showEventTypeDropdown = ref(false);
        const showEmptyEventTypeWarning = ref(false);
        const showDeleteEventConfirmation = ref(false);
        const eventToDelete = ref(null);
        const deletedEvents = ref([]);
        const showDeleteEventTypeConfirmation = ref(false);
        const eventTypeToDelete = ref(null);

        // Form data
        const newTimeline = ref({ name: '', description: '' });
        const newEvent = ref({ type: '', time: '', note: '' });
        const popularColors = [
            { name: 'Blue', value: '#3B82F6' },
            { name: 'Green', value: '#10B981' },
            { name: 'Red', value: '#EF4444' },
            { name: 'Yellow', value: '#F59E0B' },
            { name: 'Purple', value: '#8B5CF6' },
            { name: 'Pink', value: '#EC4899' },
            { name: 'Orange', value: '#F97316' },
            { name: 'Teal', value: '#14B8A6' },
            { name: 'Indigo', value: '#6366F1' },
            { name: 'Gray', value: '#6B7280' }
        ];
        const newEventType = ref({ name: '', color: popularColors[0].value });
        const editingEvent = ref(null);
        const editingEventType = ref({ name: '', color: popularColors[0].value, originalName: '' });

        // Computed
        const hasTimelines = computed(() => timelines.value.length > 0);
        const filteredEventTypes = computed(() => {
            if (!selectedTimeline.value) return [];
            const search = eventTypeSearch.value.toLowerCase();
            return selectedTimeline.value.event_types.filter(type => 
                type.name.toLowerCase().includes(search)
            );
        });

        const sortedEvents = computed(() => {
            if (!selectedTimeline.value) return [];
            return [...selectedTimeline.value.events].sort((a, b) => {
                return new Date(a.time) - new Date(b.time);
            });
        });

        // Methods
        const loadTimelines = async () => {
            try {
                const response = await axios.get('/api/timelines');
                // Map the response data to match our frontend structure
                timelines.value = response.data.map(timeline => ({
                    id: timeline.id,
                    name: timeline.name,
                    description: timeline.description,
                    events: timeline.events || [],
                    event_types: timeline.event_types || []
                }));
                if (timelines.value.length > 0 && !selectedTimeline.value) {
                    selectTimeline(timelines.value[0]);
                }
            } catch (error) {
                console.error('Error loading timelines:', error);
                alert('Failed to load timelines. Please try again.');
            }
        };

        const selectTimeline = (timeline) => {
            selectedTimeline.value = timeline;
        };

        const createTimeline = async () => {
            try {
                const response = await axios.post('/api/timeline', {
                    name: newTimeline.value.name,
                    description: newTimeline.value.description
                });
                // Map the response data to match our frontend structure
                const timeline = {
                    id: response.data.id,
                    name: response.data.name,
                    description: response.data.description,
                    events: response.data.events || [],
                    event_types: response.data.event_types || []
                };
                timelines.value.push(timeline);
                selectTimeline(timeline);
                showCreateTimelineModal.value = false;
                newTimeline.value = { name: '', description: '' };
            } catch (error) {
                console.error('Error creating timeline:', error);
                alert('Failed to create timeline. Please try again.');
            }
        };

        const updateTimeline = async () => {
            try {
                await axios.put(`/api/timeline/${selectedTimeline.value.id}`, selectedTimeline.value);
                showEditTimelineModal.value = false;
            } catch (error) {
                console.error('Error updating timeline:', error);
            }
        };

        const deleteTimeline = async () => {
            try {
                await axios.delete(`/api/timeline/${selectedTimeline.value.id}`);
                timelines.value = timelines.value.filter(t => t.id !== selectedTimeline.value.id);
                selectedTimeline.value = null;
                showDeleteTimelineModal.value = false;
            } catch (error) {
                console.error('Error deleting timeline:', error);
            }
        };

        const createEvent = async () => {
            if (!newEvent.value.type) return;

            try {
                // Convert local date to UTC before sending to server
                const eventToCreate = {
                    ...newEvent.value,
                    time: newEvent.value.time ? new Date(newEvent.value.time).toISOString() : new Date().toISOString()
                };

                const response = await axios.post(`/api/timeline/${selectedTimeline.value.id}/events`, eventToCreate);
                selectedTimeline.value.events.push(response.data);
                newEvent.value = { type: '', time: '', note: '' };
            } catch (error) {
                console.error('Error creating event:', error);
            }
        };

        const updateEvent = async () => {
            try {
                // Convert local date back to UTC before sending to server
                const eventToUpdate = {
                    ...editingEvent.value,
                    time: editingEvent.value.time ? new Date(editingEvent.value.time).toISOString() : null
                };
                
                await axios.put(`/api/timeline/${selectedTimeline.value.id}/events/${editingEvent.value.id}`, eventToUpdate);
                const index = selectedTimeline.value.events.findIndex(e => e.id === editingEvent.value.id);
                if (index !== -1) {
                    selectedTimeline.value.events[index] = eventToUpdate;
                }
                showEditEventModal.value = false;
            } catch (error) {
                console.error('Error updating event:', error);
            }
        };

        const deleteEvent = async (event) => {
            eventToDelete.value = event;
            showDeleteEventConfirmation.value = true;
        };

        const confirmDeleteEvent = async () => {
            try {
                await axios.delete(`/api/timeline/${selectedTimeline.value.id}/events/${eventToDelete.value.id}`);
                selectedTimeline.value.events = selectedTimeline.value.events.filter(e => e.id !== eventToDelete.value.id);
                showDeleteEventConfirmation.value = false;
                eventToDelete.value = null;
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Failed to delete event. Please try again.');
            }
        };

        const undoDelete = async () => {
            const lastDeleted = deletedEvents.value.pop();
            if (lastDeleted && lastDeleted.timelineId === selectedTimeline.value.id) {
                // Immediately restore the event in the view
                selectedTimeline.value.events.push(lastDeleted.event);
                showUndoToast.value = false;
            }
        };

        const createEventType = async () => {
            if (!newEventType.value.name || newEventType.value.name.trim() === '') {
                showEmptyEventTypeWarning.value = true;
                return;
            }

            try {
                const response = await axios.post(`/api/timeline/${selectedTimeline.value.id}/event-types`, newEventType.value);
                if (response.status === 200) {
                    selectedTimeline.value.event_types.push(response.data);
                    newEventType.value = { name: '', color: '#3b82f6' };
                }
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    showDuplicateEventTypeWarning.value = true;
                } else {
                    showToast('Failed to create event type', 'error');
                }
            }
        };

        const deleteEventType = async (type) => {
            // Check if event type is in use
            const isInUse = selectedTimeline.value.events.some(event => event.type === type.name);
            if (isInUse) {
                showDeleteEventTypeWarning.value = true;
                return;
            }

            eventTypeToDelete.value = type;
            showDeleteEventTypeConfirmation.value = true;
        };

        const confirmDeleteEventType = async () => {
            try {
                await axios.delete(`/api/timeline/${selectedTimeline.value.id}/event-types/${encodeURIComponent(eventTypeToDelete.value.name)}`);
                selectedTimeline.value.event_types = selectedTimeline.value.event_types.filter(t => t.name !== eventTypeToDelete.value.name);
                showDeleteEventTypeConfirmation.value = false;
                eventTypeToDelete.value = null;
            } catch (error) {
                console.error('Error deleting event type:', error);
                alert('Failed to delete event type. Please try again.');
            }
        };

        const updateEventType = async () => {
            try {
                const oldName = editingEventType.value.originalName;
                const newName = editingEventType.value.name;
                const newColor = editingEventType.value.color;
                
                await axios.put(`/api/timeline/${selectedTimeline.value.id}/event-types/${encodeURIComponent(oldName)}`, {
                    name: newName,
                    color: newColor
                });
                
                // Update all events using this type
                selectedTimeline.value.events.forEach(event => {
                    if (event.type === oldName) {
                        event.type = newName;
                    }
                });
                
                // Update the event type in the list
                const index = selectedTimeline.value.event_types.findIndex(et => et.name === oldName);
                if (index !== -1) {
                    selectedTimeline.value.event_types[index] = { name: newName, color: newColor };
                }
                
                showEditEventTypeModal.value = false;
                editingEventType.value = { name: '', color: popularColors[0].value, originalName: '' };  // Reset the form
            } catch (error) {
                console.error('Error updating event type:', error);
                if (error.response && error.response.status === 400) {
                    showDuplicateEventTypeWarning.value = true;
                } else {
                    alert('Failed to update event type. Please try again.');
                }
            }
        };

        const editEvent = (event) => {
            // Store the original UTC date
            editingEvent.value = { 
                ...event,
                // Convert UTC to local for the input
                time: event.time ? new Date(event.time).toLocaleDateString('en-CA', {
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }) : ''
            };
            showEditEventModal.value = true;
        };

        const editEventType = (eventType) => {
            editingEventType.value = { 
                name: eventType.name,
                color: eventType.color,
                originalName: eventType.name  // Store the original name
            };
            showEditEventTypeModal.value = true;
        };

        const getEventTypeColor = (typeName) => {
            const eventType = selectedTimeline.value.event_types.find(et => et.name === typeName);
            return eventType ? eventType.color : '#1976d2';
        };

        const handleFileImport = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.name.endsWith('.json')) {
                alert('Please select a JSON file');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedTimeline = JSON.parse(e.target.result);
                    
                    // Validate the imported timeline structure
                    if (!importedTimeline.name) {
                        throw new Error('Invalid timeline format: missing timeline name');
                    }

                    const response = await axios.post('/api/timeline', importedTimeline);
                    
                    // Map the response data to match our frontend structure
                    const timeline = {
                        id: response.data.id,
                        name: response.data.name,
                        description: response.data.description,
                        events: response.data.events || [],
                        event_types: response.data.event_types || []
                    };

                    timelines.value.push(timeline);
                    selectTimeline(timeline);
                    showImportTimelineModal.value = false;
                } catch (error) {
                    console.error('Error importing timeline:', error);
                    alert(`Failed to import timeline: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };

        const exportTimelineAsPDF = async () => {
            // TODO: Implement PDF export
            console.log('Export as PDF not implemented yet');
        };

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, { 
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        };

        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                showCreateTimelineModal.value = false;
                showEditTimelineModal.value = false;
                showDeleteTimelineModal.value = false;
                showCreateEventModal.value = false;
                showEditEventModal.value = false;
                showCreateEventTypeModal.value = false;
                showEditEventTypeModal.value = false;
                showImportTimelineModal.value = false;
                showTimelineView.value = false;
            }
        };

        const selectEventType = (type) => {
            newEvent.value.type = type.name;
            eventTypeSearch.value = type.name;
            showEventTypeDropdown.value = false;
        };

        // Initialize Material UI components
        const initMDC = () => {
            const buttons = document.querySelectorAll('.mdc-button');
            buttons.forEach(button => {
                mdc.ripple.MDCRipple.attachTo(button);
            });

            const textFields = document.querySelectorAll('.mdc-text-field');
            textFields.forEach(textField => {
                mdc.textField.MDCTextField.attachTo(textField);
            });

            const selects = document.querySelectorAll('.mdc-select');
            selects.forEach(select => {
                mdc.select.MDCSelect.attachTo(select);
            });
        };

        // Lifecycle hooks
        onMounted(() => {
            loadTimelines();
            window.addEventListener('keydown', handleKeydown);
            initMDC();
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeydown);
        });

        return {
            // State
            timelines,
            selectedTimeline,
            showCreateTimelineModal,
            showEditTimelineModal,
            showDeleteTimelineModal,
            showCreateEventModal,
            showEditEventModal,
            showCreateEventTypeModal,
            showEditEventTypeModal,
            showImportTimelineModal,
            showTimelineView,
            showDeleteEventTypeWarning,
            showDuplicateEventTypeWarning,
            eventTypeSearch,
            showEventTypeDropdown,
            showEmptyEventTypeWarning,
            showDeleteEventConfirmation,
            eventToDelete,
            showDeleteEventTypeConfirmation,
            eventTypeToDelete,

            // Form data
            newTimeline,
            newEvent,
            newEventType,
            editingEvent,
            editingEventType,

            // Computed
            hasTimelines,
            filteredEventTypes,
            sortedEvents,

            // Methods
            selectTimeline,
            createTimeline,
            updateTimeline,
            deleteTimeline,
            createEvent,
            updateEvent,
            deleteEvent,
            confirmDeleteEvent,
            undoDelete,
            createEventType,
            deleteEventType,
            confirmDeleteEventType,
            updateEventType,
            editEvent,
            editEventType,
            getEventTypeColor,
            handleFileImport,
            exportTimelineAsPDF,
            formatDate,
            popularColors,
            selectEventType
        };
    }
});

app.mount('#app'); 