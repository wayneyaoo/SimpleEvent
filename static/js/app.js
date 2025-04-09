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
                timelines.value = response.data;
                if (timelines.value.length > 0 && !selectedTimeline.value) {
                    selectTimeline(timelines.value[0]);
                }
            } catch (error) {
                console.error('Error loading timelines:', error);
            }
        };

        const selectTimeline = (timeline) => {
            selectedTimeline.value = timeline;
        };

        const createTimeline = async () => {
            try {
                const response = await axios.post('/api/timelines', newTimeline.value);
                timelines.value.push(response.data);
                selectTimeline(response.data);
                showCreateTimelineModal.value = false;
                newTimeline.value = { name: '', description: '' };
            } catch (error) {
                console.error('Error creating timeline:', error);
            }
        };

        const updateTimeline = async () => {
            try {
                await axios.put(`/api/timelines/${selectedTimeline.value.id}`, selectedTimeline.value);
                showEditTimelineModal.value = false;
            } catch (error) {
                console.error('Error updating timeline:', error);
            }
        };

        const deleteTimeline = async () => {
            try {
                await axios.delete(`/api/timelines/${selectedTimeline.value.id}`);
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
                const response = await axios.post(`/api/timelines/${selectedTimeline.value.id}/events`, {
                    ...newEvent.value,
                    time: newEvent.value.time || new Date().toISOString().split('T')[0]
                });
                selectedTimeline.value.events.push(response.data);
                newEvent.value = { type: '', time: '', note: '' };
            } catch (error) {
                console.error('Error creating event:', error);
            }
        };

        const updateEvent = async () => {
            try {
                await axios.put(`/api/timelines/${selectedTimeline.value.id}/events/${editingEvent.value.id}`, editingEvent.value);
                const index = selectedTimeline.value.events.findIndex(e => e.id === editingEvent.value.id);
                if (index !== -1) {
                    selectedTimeline.value.events[index] = editingEvent.value;
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
                await axios.delete(`/api/timelines/${selectedTimeline.value.id}/events/${eventToDelete.value.id}`);
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
                const response = await axios.post(`/api/timelines/${selectedTimeline.value.id}/event-types`, newEventType.value);
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
                await axios.delete(`/api/timelines/${selectedTimeline.value.id}/event-types/${encodeURIComponent(eventTypeToDelete.value.name)}`);
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
                
                await axios.put(`/api/timelines/${selectedTimeline.value.id}/event-types/${encodeURIComponent(oldName)}`, {
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
            editingEvent.value = { ...event };
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
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const timeline = JSON.parse(e.target.result);
                        const response = await axios.post('/api/timelines', timeline);
                        timelines.value.push(response.data);
                        selectTimeline(response.data);
                        showImportTimelineModal.value = false;
                    } catch (error) {
                        console.error('Error importing timeline:', error);
                    }
                };
                reader.readAsText(file);
            }
        };

        const exportTimelineAsPDF = async () => {
            // TODO: Implement PDF export
            console.log('Export as PDF not implemented yet');
        };

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString();
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