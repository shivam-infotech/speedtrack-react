import React, { useRef, useState, useEffect } from 'react';

const CustomBottomSheet = ({ children, collapsedHeight = 200, expandedHeight = 500, onStateChange }) => {
    const sheetRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startX, setStartX] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [gestureDirection, setGestureDirection] = useState(null); // 'up', 'down', 'left', 'right'
    const [gestureType, setGestureType] = useState(null); // 'vertical' or 'horizontal'

    // Use refs for values that don't need to trigger re-renders
    const lastTouchY = useRef(0);
    const lastTouchX = useRef(0);
    const lastTouchTime = useRef(0);
    const velocityRef = useRef(0);

    const handleTouchStart = (e) => {
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        setStartY(touchY);
        setStartX(touchX);
        setDragging(true);
        setGestureDirection(null);
        setGestureType(null);

        // Initialize velocity tracking
        lastTouchY.current = touchY;
        lastTouchX.current = touchX;
        lastTouchTime.current = Date.now();
        velocityRef.current = 0;
    };

    const handleTouchMove = (e) => {
        if (!dragging) return;

        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        const deltaY = touchY - startY;
        const deltaX = touchX - startX;

        // Calculate velocity for fast flick detection
        const now = Date.now();
        const deltaTime = now - lastTouchTime.current;

        if (deltaTime > 0) {
            const instantVelocity = (touchY - lastTouchY.current) / deltaTime; // pixels per ms
            // Smooth velocity with some damping (80% previous, 20% new)
            velocityRef.current = velocityRef.current * 0.8 + instantVelocity * 0.2;
        }

        lastTouchY.current = touchY;
        lastTouchX.current = touchX;
        lastTouchTime.current = now;

        // Determine if this is a horizontal or vertical gesture if not already determined
        if (gestureType === null) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            // If movement is significantly more horizontal than vertical, treat as horizontal scroll
            if (absX > absY * 1.5) {
                setGestureType('horizontal');
                return; // Allow normal horizontal scrolling without affecting the sheet
            }
            // If movement is significantly more vertical than horizontal, treat as vertical gesture
            else if (absY > absX * 1.2) {
                setGestureType('vertical');
            }
            // If the direction is ambiguous, wait for more movement
            else {
                return; // Wait for clearer direction
            }
        }

        // If this is a horizontal gesture, don't affect the sheet
        if (gestureType === 'horizontal') {
            return;
        }

        // From here on, we're handling a vertical gesture

        // Detect gesture direction with a very small threshold for high sensitivity
        const directionThreshold = 3; // pixels - even more sensitive
        const velocityThreshold = 0.15; // pixels per ms - for immediate response

        // IMMEDIATE RESPONSE: Check velocity first for fast flicks
        const absVelocity = Math.abs(velocityRef.current);
        if (absVelocity > velocityThreshold && gestureType === 'vertical') {
            if (velocityRef.current < 0 && !isOpen) {
                // Fast upward flick while closed - open immediately
                setIsOpen(true);
                setDragging(false);
                return; // Exit early after taking action
            } else if (velocityRef.current > 0 && isOpen) {
                // Fast downward flick while open - close immediately
                setIsOpen(false);
                setDragging(false);
                return; // Exit early after taking action
            }
        }

        // For slower movements, detect direction
        if (Math.abs(deltaY) > directionThreshold && gestureType === 'vertical') {
            // Determine direction if not already set
            if (gestureDirection === null) {
                const newDirection = deltaY < 0 ? 'up' : 'down';
                setGestureDirection(newDirection);

                // IMMEDIATE RESPONSE: Act on direction immediately
                if (newDirection === 'up' && !isOpen) {
                    // Moving up while closed - open immediately
                    setIsOpen(true);
                    setDragging(false);
                    return; // Exit early after taking action
                } else if (newDirection === 'down' && isOpen) {
                    // Moving down while open - close immediately
                    setIsOpen(false);
                    setDragging(false);
                    return; // Exit early after taking action
                }
            }

            // Apply a small visual feedback based on gesture direction
            if (gestureDirection === 'up' && !isOpen) {
                setCurrentY(Math.max(deltaY, -30)); // Limit the visual feedback
            } else if (gestureDirection === 'down' && isOpen) {
                setCurrentY(Math.min(deltaY, 30)); // Limit the visual feedback
            }
        }
    };

    const handleTouchEnd = () => {
        // Just clean up any remaining state
        // The actual open/close logic now happens in handleTouchMove for immediate response

        // Reset states
        setCurrentY(0);
        setDragging(false);
        setGestureDirection(null);
        setGestureType(null);
        velocityRef.current = 0;
    };

    useEffect(() => {
        if (!dragging) {
            setCurrentY(0);
        }
    }, [dragging]);

    // Notify parent component when isOpen state changes
    useEffect(() => {
        if (onStateChange) {
            onStateChange({ 
                isOpen, 
                currentHeight: isOpen ? expandedHeight : collapsedHeight 
            });
        }
    }, [isOpen, expandedHeight, collapsedHeight, onStateChange]);

    return (
        <div
            ref={sheetRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#fff',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
                transform: `translateY(calc(${isOpen ? 0 : expandedHeight - collapsedHeight}px + ${currentY}px))`,
                transition: dragging ? 'none' : 'transform 0.25s ease-out',
                maxHeight: expandedHeight,
                height: expandedHeight,
                overflowY: 'auto',
                zIndex: 999,
            }}
        >
            {/* Handle Bar */}
            <div
                style={{
                    width: 50,
                    height: 5,
                    backgroundColor: '#ccc',
                    borderRadius: 2.5,
                    margin: '8px auto',
                }}
            />
            {/* Content Area */}
            <div style={{ padding: 0 }}>
                {children}
            </div>
        </div>
    );
};

export default CustomBottomSheet;
