import { createSlice } from '@reduxjs/toolkit';
import { fetchSummary, fetchSummaryForDevice } from './summary';

const { reducer, actions } = createSlice({
  name: 'devices',
  initialState: {
    items: {},
    selectedId: null,
    selectedIds: [],
  },
  reducers: {
    refresh(state, action) {
      state.items = {};
      action.payload.forEach((item) => state.items[item.id] = item);
    },
    update(state, action) {
      state.newDevices = [];
      action.payload.forEach((item) => {
        const isNewDevice = !state.items[item.id];
        state.items[item.id] = item;
        if (isNewDevice) {
          state.newDevices.push(item.id);
        }
      });
    },
    selectId(state, action) {
      state.selectTime = Date.now();
      state.selectedId = action.payload;
      state.selectedIds = state.selectedId ? [state.selectedId] : [];
    },
    selectIds(state, action) {
      state.selectTime = Date.now();
      state.selectedIds = action.payload;
      [state.selectedId] = state.selectedIds;
    },
    remove(state, action) {
      delete state.items[action.payload];
    },
  },
});

export const refreshDevices = (payload) => async (dispatch) => {
  dispatch(actions.refresh(payload));
  dispatch(fetchSummary());
};

export const updateDevices = (payload) => async (dispatch, getState) => {
  dispatch(actions.update(payload));
  const { newDevices } = getState().devices;
  if (newDevices && newDevices.length > 0) {
    newDevices.forEach((deviceId) => {dispatch(fetchSummaryForDevice(deviceId))});
  }
};

export { actions as devicesActions };
export { reducer as devicesReducer };
