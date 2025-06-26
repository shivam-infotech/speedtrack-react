import { create } from 'zustand'
import { createSimpleSecureStore } from '../utils/simpleSecureStorage.js'

export const useGeneralStore = create(
    createSimpleSecureStore('general-store')(
        (set) => ({
            isSaved: false,
            hasSavedUser: false,
            hasSavedDevice: false,
            savedDeviceId: null,
            setHasSavedUser: (hasSavedUser) => set({ hasSavedUser }),
            setHasSavedDevice: (hasSavedDevice) => set({ hasSavedDevice }),
            setSavedDeviceId: (savedDeviceId) => set({ savedDeviceId }),
            setIsSaved: (isSaved) => set({ isSaved }),
            isUserRemoved: false,
            setIsUserRemoved: (isUserRemoved) => set({ isUserRemoved }),
            userToRemove: null,
            setUserToRemove: (userToRemove) => set({ userToRemove }),
            userRole: null,
            setUserRole: (userRole) => set({ userRole }),
            userData: null,
            setUserData: (userData) => set({ userData }),
        })
    ))
