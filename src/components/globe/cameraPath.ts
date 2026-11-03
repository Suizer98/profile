import { phoneLayout } from "../../utils/appViewport.ts"
import { cameraStops, type CameraStop } from "./stops.ts"

export type SampledCamera = {
  longitude: number
  latitude: number
  altitude: number
  tilt: number
  heading: number
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

function lerpAngle(from: number, to: number, amount: number) {
  const delta = ((((to - from) % 360) + 540) % 360) - 180
  return from + delta * amount
}

function lerpAltitude(from: number, to: number, amount: number) {
  const logFrom = Math.log(Math.max(from, 1))
  const logTo = Math.log(Math.max(to, 1))
  return Math.exp(logFrom + (logTo - logFrom) * amount)
}

function descentLatitude(from: number, to: number, amount: number) {
  const pulled = 1 - (1 - amount) ** 2
  return lerp(from, to, pulled)
}

const holdStart = 0.55
const phoneHoldStart = 0.18
const skillsHold = 0.62
const earthRadius = 6371000

function holdEase(amount: number) {
  if (amount <= holdStart) {
    return 0
  }
  const shifted = (amount - holdStart) / (1 - holdStart)
  return shifted * shifted * (3 - 2 * shifted)
}

function phoneWorkplaceTravel(amount: number) {
  if (amount <= phoneHoldStart) {
    return 0
  }
  return (amount - phoneHoldStart) / (1 - phoneHoldStart)
}

export function atWorkplace(index: number) {
  const stop = cameraStops[index]
  return Boolean(stop?.orbit)
}

export function holdingAtWorkplace(index: number, blend: number) {
  if (!atWorkplace(index)) {
    return false
  }
  return blend <= (phoneLayout() ? phoneHoldStart : holdStart)
}

export function orbitWorkplace(index: number, heading: number): SampledCamera {
  const stop = cameraStops[index]
  const tiltRadians = (stop.tilt * Math.PI) / 180
  const distance = stop.altitude * Math.tan(tiltRadians)
  const targetLatitude = stop.latitude + distance / 111320
  const targetLongitude = stop.longitude
  const bearing = ((heading + 180) * Math.PI) / 180
  const north = distance * Math.cos(bearing)
  const east = distance * Math.sin(bearing)
  return {
    longitude: targetLongitude + east / (111320 * Math.cos((targetLatitude * Math.PI) / 180)),
    latitude: targetLatitude + north / 111320,
    altitude: stop.altitude,
    tilt: stop.tilt,
    heading,
  }
}

export function sampleCamera(index: number, blend: number): SampledCamera {
  const lastIndex = cameraStops.length - 1
  const fromIndex = Math.min(Math.max(index, 0), lastIndex)
  const toIndex = Math.min(fromIndex + 1, lastIndex)
  const from: CameraStop = cameraStops[fromIndex]
  const to: CameraStop = cameraStops[toIndex]
  const travel = Math.min(Math.max(blend, 0), 1)
  if (from.depart === "dive" && fromIndex !== toIndex) {
    return sampleDive(from, to, travel)
  }
  const workplaceTravel = phoneLayout() ? phoneWorkplaceTravel(travel) : holdEase(travel)
  const amount = fromIndex === toIndex ? 1 : atWorkplace(fromIndex) ? workplaceTravel : travel
  const altitude = lerpAltitude(from.altitude, to.altitude, amount)
  const tilt = lerp(from.tilt, to.tilt, amount)
  const heading = lerpAngle(from.heading, to.heading, amount)

  const latitude =
    from.depart === "descent"
      ? descentLatitude(from.latitude, to.latitude, amount)
      : from.depart === "ground"
        ? latitudeAlongGround(from, to, amount, altitude, tilt, heading)
        : lerp(from.latitude, to.latitude, amount)

  return {
    longitude: lerp(from.longitude, to.longitude, amount),
    latitude,
    altitude,
    tilt,
    heading,
  }
}

export function mixCamera(from: SampledCamera, to: SampledCamera, amount: number): SampledCamera {
  const t = Math.min(1, Math.max(0, amount))
  return {
    longitude: lerp(from.longitude, to.longitude, t),
    latitude: lerp(from.latitude, to.latitude, t),
    altitude: lerpAltitude(from.altitude, to.altitude, t),
    tilt: lerp(from.tilt, to.tilt, t),
    heading: lerpAngle(from.heading, to.heading, t),
  }
}

export function cameraSettled(from: SampledCamera, to: SampledCamera) {
  const north = (to.latitude - from.latitude) * 111320
  const east = (to.longitude - from.longitude) * 111320 * Math.cos((from.latitude * Math.PI) / 180)
  const ground = Math.hypot(north, east)
  const altitudeGap = Math.abs(Math.log(Math.max(to.altitude, 1)) - Math.log(Math.max(from.altitude, 1)))
  const headingGap = Math.abs(((((to.heading - from.heading) % 360) + 540) % 360) - 180)
  return ground < 4 && altitudeGap < 0.002 && headingGap < 0.15 && Math.abs(to.tilt - from.tilt) < 0.15
}

function lookOffset(altitude: number, tilt: number) {
  const tiltRadians = (tilt * Math.PI) / 180
  const reach = Math.sin(tiltRadians) * ((earthRadius + altitude) / earthRadius)
  if (reach >= 1 || reach <= 0) {
    return 0
  }
  return ((Math.asin(reach) - tiltRadians) * 180) / Math.PI
}

function groundTarget(stop: CameraStop) {
  const offset = lookOffset(stop.altitude, stop.tilt)
  const bearing = (stop.heading * Math.PI) / 180
  return {
    longitude: stop.longitude + (offset * Math.sin(bearing)) / Math.cos((stop.latitude * Math.PI) / 180),
    latitude: stop.latitude + offset * Math.cos(bearing),
  }
}

function latitudeAlongGround(
  from: CameraStop,
  to: CameraStop,
  amount: number,
  altitude: number,
  tilt: number,
  heading: number,
) {
  const targetLatitude = lerp(groundTarget(from).latitude, groundTarget(to).latitude, amount)
  const bearing = (heading * Math.PI) / 180
  return targetLatitude - lookOffset(altitude, tilt) * Math.cos(bearing)
}

function sampleDive(from: CameraStop, to: CameraStop, travel: number): SampledCamera {
  if (travel <= skillsHold) {
    return {
      longitude: from.longitude,
      latitude: from.latitude,
      altitude: from.altitude,
      tilt: from.tilt,
      heading: from.heading,
    }
  }
  const leg = (travel - skillsHold) / (1 - skillsHold)
  const altitude = lerpAltitude(from.altitude, to.altitude, leg)
  const tilt = lerp(from.tilt, to.tilt, leg)
  const heading = lerpAngle(from.heading, to.heading, leg)
  const fromTarget = groundTarget(from)
  const toTarget = groundTarget(to)
  const targetLatitude = lerp(fromTarget.latitude, toTarget.latitude, leg)
  const targetLongitude = lerp(fromTarget.longitude, toTarget.longitude, leg)
  const bearing = (heading * Math.PI) / 180
  const offset = lookOffset(altitude, tilt)
  return {
    longitude: targetLongitude - (offset * Math.sin(bearing)) / Math.cos((targetLatitude * Math.PI) / 180),
    latitude: targetLatitude - offset * Math.cos(bearing),
    altitude,
    tilt,
    heading,
  }
}
