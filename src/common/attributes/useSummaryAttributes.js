import { useMemo } from 'react';

export default (t) => useMemo(() => ({
    distance: {
        name: t('positionDistance'),
        type: "number",
        datatype: 'distance',
        property: true
    },
    averageSpeed: {
        name: t('reportAverageSpeed'),
        type: "number",
        datatype: 'speed',
        property: true
    },
    maxSpeed:{
        name: t('reportMaximumSpeed'),
        type: "number",
        datatype: 'speed',
        property: true
    },
    startOdometer:{
        name: t('reportStartOdometer'),
        type: "number",
        datatype: 'distance',
        property: true
    },
    endOdometer:{
        name: t('reportEndOdometer'),
        type: "number",
        datatype: 'distance',
        property: true
    },
    startTime:{
        name: t('reportStartTime'),
        type: "string",
        property: true
    },
    endTime:{
        name: t('reportEndTime'),
        type: "string",
        property: true
    },
    startHours:{
        name: t('reportStartEngineHours'),
        type: "number",
        dataType: 'hours',
        property: true
    },
    endHours:{
        name: t('reportEndEngineHours'),
        type: "number",
        dataType: 'hours',
        property: true
    },
    engineHours:{
        name: t('reportEngineHours'),
        type: "number",
        dataType: 'hours',
        property: true
    }
}), [t]);
