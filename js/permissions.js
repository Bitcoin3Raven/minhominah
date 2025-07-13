// Memory permissions helper functions
const memoryPermissions = {
    // Check if current user can edit a memory
    canEdit: function(memory) {
        if (!currentUser) return false;
        
        // Memory creator can always edit their own memories
        const isOwner = memory.created_by === currentUser.id || memory.user_id === currentUser.id;
        
        // Parent role can edit any memory in the family
        const isParent = window.familySystem && window.familySystem.currentRole === 'parent';
        
        return isOwner || isParent;
    },
    
    // Check if current user can delete a memory
    canDelete: function(memory) {
        if (!currentUser) return false;
        
        // Memory creator can always delete their own memories
        const isOwner = memory.created_by === currentUser.id || memory.user_id === currentUser.id;
        
        // Parent role can delete any memory in the family
        const isParent = window.familySystem && window.familySystem.currentRole === 'parent';
        
        return isOwner || isParent;
    },
    
    // Check if user has any management permissions
    canManage: function(memory) {
        return this.canEdit(memory) || this.canDelete(memory);
    },
    
    // Get permission reason (for UI display)
    getPermissionReason: function(memory) {
        if (!currentUser) return null;
        
        const isOwner = memory.created_by === currentUser.id || memory.user_id === currentUser.id;
        const isParent = window.familySystem && window.familySystem.currentRole === 'parent';
        
        if (isOwner && isParent) {
            return 'owner_and_parent';
        } else if (isOwner) {
            return 'owner';
        } else if (isParent) {
            return 'parent';
        }
        
        return null;
    },
    
    // Check if user is in a family
    isInFamily: function() {
        return window.familySystem && window.familySystem.currentFamily;
    },
    
    // Get current user role
    getCurrentRole: function() {
        return window.familySystem ? window.familySystem.currentRole : null;
    }
};

// Export for use in other files
window.memoryPermissions = memoryPermissions;