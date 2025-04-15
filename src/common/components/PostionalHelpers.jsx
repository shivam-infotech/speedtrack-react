import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BackHandIcon from '@mui/icons-material/BackHand';
import LeakRemoveIcon from '@mui/icons-material/LeakRemove';

import KeyIcon from '@mui/icons-material/Key';

import Battery0BarIcon from '@mui/icons-material/Battery0Bar';
import Battery20Icon from '@mui/icons-material/Battery20';
import Battery30Icon from '@mui/icons-material/Battery30';
import Battery50Icon from '@mui/icons-material/Battery50';
import Battery60Icon from '@mui/icons-material/Battery60';
import Battery80Icon from '@mui/icons-material/Battery80';
import Battery90Icon from '@mui/icons-material/Battery90';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryUnknownIcon from '@mui/icons-material/BatteryUnknown';

import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalCellularAlt2BarIcon from '@mui/icons-material/SignalCellularAlt2Bar';
import SignalCellularAlt1BarIcon from '@mui/icons-material/SignalCellularAlt1Bar';
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar';

import AcUnitIcon from '@mui/icons-material/AcUnit';

import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import { CarCrash } from '@mui/icons-material';

export const statusIcon = (status, color, size = "small") => {
    switch (status) {
      case 'running':
        return <DirectionsRunIcon color={color} fontSize={size} />
      case 'stopped':
        return <BackHandIcon color={color} fontSize={size} />
      case 'idle':
        return <DirectionsWalkIcon color={color} fontSize={size} />
      default:
        return <LeakRemoveIcon color={color} fontSize={size} />
    }
}

export const IgnitionIcon = (status, color = null, size = "small") => {
  return <KeyIcon fontSize={size} color={status ? 'success' : 'neutral'} />
}

export const MotionIcon = (motion, color, size = 'small') => {
  return <CarCrash fontSize={size} color={color || motion ? 'success' : 'error'} />
}

export const BatteryLevelIcon = (level, color = null, size = 'small') => {
  if (level > 0 && level < 10) { return <Battery0BarIcon fontSize={size} color={color || 'error'} /> }
  else if (level > 10 && level < 20) { return <Battery20Icon fontSize={size} color={color || "error"} /> }
  else if (level > 20 && level < 50) { return <Battery30Icon fontSize={size} color={color || 'warning'} /> }
  else if (level > 50 && level < 60) { return <Battery50Icon fontSize={size} color={color || 'tertiary'} /> }
  else if (level > 60 && level < 80) { return <Battery60Icon fontSize={size} color={color || 'tertiary'} /> }
  else if (level > 80 && level < 90) { return <Battery80Icon fontSize={size} color={color || 'success'} /> }
  else if (level > 90 && level < 95) { return <Battery90Icon fontSize={size} color={color || 'success'} /> }
  else if (level > 95 && level < 101) { return <BatteryFullIcon fontSize={size} color={color || 'success'} /> }
  else { return <BatteryUnknownIcon fontSize={size} color={color || 'neutral'} /> }
}

export const GSMSignalIcon = (rssi, color = null, size = 'small') => {
    if(rssi >= 4) return <SignalCellularAltIcon fontSize={size} color={color || 'success'} />
    else if (rssi >= 2) return <SignalCellularAlt2BarIcon fontSize={size} color={color || 'success'} />
    else if(rssi === 1) return <SignalCellularAlt1BarIcon fontSize={size} color={color || 'warning'} />
    else return <SignalCellularConnectedNoInternet0BarIcon fontSize={size} color={color || 'neutral'} />
}

export const GSMConditionStatus = (rssi) => {
  return rssi == 1 ? 'conditionPoor':
  rssi == 2 ? "conditionWeak" :
  rssi == 3 ? "conditionNormal":
  rssi == 4 ? "conditionGood":
  rssi == 5 ? "conditionGreat" : "N/A";
}

export const ACIcon = (ac, color = null, size = "small") => {
    return <AcUnitIcon fontSize={size} color={color || (ac ? 'success' : 'error')} />
}

export const SatelliteSignalIcon = (sat, size = "small") => {
    return <SatelliteAltIcon fontSize={size} color={(sat ? (sat > 5 ? 'success' : 'warning') : 'neutral' ) } />
}

export const SatelliteConditionStatus = (satellite) => {

  if(satellite === undefined) return 'N/A';
  else if(satellite <= 5) return 'conditionPoor';
  else if(satellite > 5 && satellite <= 10) return 'conditionGood';
  else if(satellite > 10) return 'conditionGreat';
}

export const ChargingIcon = (charge, size = "small") => {
    return <ElectricalServicesIcon fontSize={size} color={charge === undefined ? 'neutral' : charge ? 'success' : 'error'} />
}

export const ChargingStatus = (charge) => {
  return charge ? 'attributeChargeCharging' : 'attributeChargeNotCharging';
}

export const ParkingIcon = (position, size = 'small') => {
    if(!position) return <LocalParkingIcon fontSize={size} color={'neutral'} />
    else if(position?.attributes?.hasOwnProperty('parking')) return <LocalParkingIcon fontSize={size} color={position?.attributes?.parking ? 'success' : 'error'} />
    else if(position?.attributes?.ignition && position?.attributes?.motion && position?.attributes?.speed) return <LocalParkingIcon fontSize={size} color={!position.attributes.ignition && position.speed === 0 && !position.attributes.motion ? 'success' : 'error'} />
    return <LocalParkingIcon fontSize={size} color={'error'} />
}

export const ParkingStatus = (position) => {

  if(!position) return "N/A";
  else if(position?.attributes?.hasOwnProperty('parking')) return position?.attributes?.parking ? 'deviceParkingParked' : 'deviceParkingNotParked';
  else if(position?.attributes?.ignition && position?.attributes?.activity && position?.attributes?.activityDurationHours){
    if(position?.attributes?.ignition === false && position?.attributes?.motion === false && position?.speed === 0){
      if(position?.attributes?.activity === 'stopped' && position?.attributes?.activityDurationHours > (1000 * 60 * 5)){ // 5 minutes
        return 'deviceParkingParked'
      }else 'deviceParkingNotParked';
    }
  }else if(position?.attributes?.activity === 'stopped') return "deviceParkingParked";
  return "deviceParkingNotParked";
}

export const FuelIcon = (fuel, color = null, size = 'small') => {
    return <LocalGasStationIcon fontSize={size} color={fuel === undefined ? (fuel > 1 ? 'success' : 'error') : 'neutral'} />
}