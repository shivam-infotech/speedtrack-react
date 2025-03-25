import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';

const { reducer, actions } = createSlice({
    name: 'summary',
    initialState: {
        items: {},
    },
    reducers: {
        refresh(state, action) {
            state.items = {};
            action.payload.forEach((item) => state.items[item.deviceId] = item);
        },
        update(state, action) {
            action.payload.forEach((item) => state.items[item.deviceId] = item);
        },
        remove(state, action) {
            delete state.items[action.payload];
        },
    },
});

export const fetchSummary = () => async (dispatch, getState) => {
    const { devices } = getState();
    const deviceIds = Object.keys(devices.items);
    const query = new URLSearchParams();
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    query.append('from', dayjs().startOf('day').toISOString());
    query.append('to', dayjs().endOf('day').toISOString());
    const response = await fetch(`/api/reports/summary?${query}`, {
        headers: { Accept: 'application/json' },
    });
    if (response.ok) {
        dispatch(actions.refresh(await response.json()));
    }
};

export const updateSummaryFromPosition = (position) => async (dispatch, getState) => {
    const { summary } = getState();
    const deviceId = position.deviceId;
    const existingSummary = summary?.items[deviceId] || {};

    if (existingSummary) {
        const updatedSummary = {
            ...existingSummary,
            distance: existingSummary.distance + (position.attributes.distance || 0),
            endOdometer: position.attributes.totalDistance || existingSummary.endOdometer,
            engineHours: existingSummary.engineHours + (position.attributes.hours || 0),
            endHours: position.attributes.hours || existingSummary.endHours,
            spentFuel: existingSummary.spentFuel + (position.attributes.fuelUsed || 0),
        };
        switch(position.activity){
            case 'running':
                updatedSummary.runningHours + position.activityDurationHours
                break;
            case 'idle': 
                updatedSummary.idleHours + position.activityDurationHours
                break;
            case 'stopped': 
                updatedSummary.idleHours + position.activityDurationHours
                break;
        }
        dispatch(actions.update([updatedSummary]));
    }
};

export const fetchSummaryForDevice = (deviceId) => async (dispatch) => {
    const query = new URLSearchParams();
    query.append('deviceId', deviceId);
    query.append('from', dayjs().startOf('day').toISOString());
    query.append('to', dayjs().endOf('day').toISOString());
    const response = await fetch(`/api/reports/summary?${query}`, {
        headers: { Accept: 'application/json' },
    });
    if (response.ok) {
        dispatch(actions.update(await response.json()));
    }
};

export { actions as summaryActions };
export { reducer as summaryReducer };
