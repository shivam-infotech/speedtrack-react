import { calculateDistance } from "./common/util/position";
import { animations } from "./common/util/useAnimationEase";
const interpolationWorker = {
    queue: {},
    lastKnowPositions: {},
    easing: null,
    animationDuration: 1000,
    shouldSkipCoordinates: false,
    messagesNamespaces: {
        init: 'init',
        newCoordinates: "newCoordinates",
        interpolation: "interpolation",
        skipToLatestPositions: "skipToLatestPositions",
        resumeAnimations: 'resumeAnimations'

    },
    animatorContext: null,
    isAnimating: false,
    lastRotations: {},


    // generate all the interpolations between the given positions
    animate(ts) {
        let shouldIterate = false;
        let newPositions = {};

        for (const [deviceId, queue] of Object.entries(this.queue)) {
            if (queue.length > 0) {
                const [from, to] = queue[0];
                let interpolatedPosition;
                if (from.longitude === to.longitude && from.latitude === to.latitude && from.rotation === to.rotation && to?.attributes?.distance === 0) interpolatedPosition = to;
                else {
                    const distance = to?.attributes?.distance || calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
                    const currentSpeed = to?.speed ? Math.max(Math.min(to.speed, 25), 5) : 5;
                    const speedInmps = currentSpeed * (1000 / 3600);

                    const adjustedDuration = speedInmps > 0 ? (distance / speedInmps) * 600 : this.animationDuration;

                    const elapsed = performance.now() - from._startTime;
                    const progress = Math.min(elapsed / adjustedDuration, 1);
                    const eased = this.easing(progress);

                    const latitude = from.latitude + (to.latitude - from.latitude) * eased;
                    const longitude = from.longitude + (to.longitude - from.longitude) * eased;

                    const fromRotation = this.lastRotations[deviceId] ?? from.course;
                    const toRotation = calculateBearing(from.latitude, from.longitude, to.latitude, to.longitude) ?? to.course;
                    let delta = toRotation - fromRotation;

                    // Normalize to shortest rotation direction
                    if (delta > 180) delta -= 360;
                    if (delta < -180) delta += 360;

                    const rotation = (fromRotation + delta * eased + 360) % 360;
                    this.lastRotations[deviceId] = rotation;
                    interpolatedPosition = { ...to, latitude, longitude, course: rotation };

                    if (progress < 1) {
                        if (this.shouldSkipCoordinates) this.skipToLatestPositions();
                        shouldIterate = true;
                    } else {
                        queue.shift();
                        this.queue[deviceId] = queue;
                        if (Object.values(this.queue).every(v => v.length < 1)) shouldIterate = true;
                        if (queue.length > 0) queue[0][0]._startTime = performance.now();
                    }
                }
                newPositions[deviceId] = interpolatedPosition;
            }
        }

        if (Object.keys(newPositions).length > 0) postMessage({ type: interpolationWorker.messagesNamespaces.interpolation, payload: newPositions });
        if (shouldIterate) {
            if (this.shouldSkipCoordinates) this.skipToLatestPositions();
            this.animatorContext = requestAnimationFrame((ts) => this.animate(ts));
        } else this.isAnimating = false;
    },

    // process the current queue
    processQueue() {
        this.animatorContext = requestAnimationFrame((ts) => this.animate(ts))
    },

    // skips the single segment
    postSegmentMessage() {
        const step = () => {
            let shouldIterate = true;
            const newPositions = {};
    
            for (const [deviceId, queue] of Object.entries(this.queue)) {
                if (queue.length > 0) {
                    const [, to] = queue[0];
                    newPositions[deviceId] = to;
                    queue.shift();
                    this.queue[deviceId] = queue;
                    if (Object.values(this.queue).every(v => v.length < 1)) shouldIterate = false;
                }
            }
    
            postMessage({ type: this.messagesNamespaces.interpolation, payload: newPositions });
    
            if (shouldIterate) requestAnimationFrame(step);
            else this.isAnimating = false;
        };
    
        requestAnimationFrame(step);
    },

    // skip the coordinates to the latest known positions
    skipToLatestPositions() {
        this.shouldSkipCoordinates = true;
        if (this.animatorContext) { cancelAnimationFrame(this.animatorContext); this.animatorContext = null; }
        this.postSegmentMessage();
    },

    // add a new position to the queue
    pushPositions(positions) {
        for (const [deviceId, pos] of Object.entries(positions)) {
            const last = this.lastKnowPositions[deviceId];

            if (!last || last?.latitude !== pos.latitude || last?.longitude !== pos.longitude || last?.attributes?.activity !== pos?.attributes?.activity) {
                const from = last || pos;
                const to = pos;

                if (!this.queue[deviceId]) this.queue[deviceId] = [];

                this.queue[deviceId].push([{ ...from, _startTime: performance.now() }, { ...to, _lastSet: false }]);
                this.lastKnowPositions[deviceId] = pos;
            }

            if (!this.animatorContext) {
                this.isAnimating = true;

                if (this.shouldSkipCoordinates) this.skipToLatestPositions();
                else this.processQueue();
            }
        }
    },

    init(payload){
        this.easing = animations[payload.easing] || animations.easeInOutQuad;
        this.animationDuration = payload.animationDuration || 2000;
    },
    // handle all the signals from the main thread
    processSignal(event) {
        const { type, payload } = event.data;

        switch (type) {
            case interpolationWorker.messagesNamespaces.init:
                this.init(payload); break;
            case interpolationWorker.messagesNamespaces.newCoordinates:
                console.log("new coordinates", payload);
                this.pushPositions(payload); break;
            case interpolationWorker.messagesNamespaces.skipToLatestPositions:
                this.skipToLatestPositions(); break;
            case interpolationWorker.messagesNamespaces.resumeAnimations:
                this.shouldSkipCoordinates = false;
        }
    }
}

onmessage = interpolationWorker.processSignal.bind(interpolationWorker);