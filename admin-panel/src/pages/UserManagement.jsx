import React, { useState } from 'react';
import UserList from '../components/user/UserList.jsx';
import UserForm from '../components/user/UserForm.jsx';

function UserManagement() {
    const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedUser, setSelectedUser] = useState(null);

    // Handle create user
    const handleCreateUser = () => {
        setSelectedUser(null);
        setCurrentView('create');
    };

    // Handle edit user
    const handleEditUser = (user) => {
        setSelectedUser(user);
        setCurrentView('edit');
    };

    // Handle save user (create or update)
    const handleSaveUser = (savedUser) => {
        // Return to list view after successful save
        setCurrentView('list');
        setSelectedUser(null);
    };

    // Handle cancel form
    const handleCancelForm = () => {
        setCurrentView('list');
        setSelectedUser(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Main content */}
            <main className=" mx-auto py-0 sm:px-6 lg:px-8">
                <div className="px-4 py-0 sm:px-0">
                    {currentView === 'list' && (
                        <UserList
                            onCreateUser={handleCreateUser}
                            onEditUser={handleEditUser}
                        />
                    )}

                    {currentView === 'create' && (
                        <UserForm
                            mode="create"
                            onSave={handleSaveUser}
                            onCancel={handleCancelForm}
                        />
                    )}

                    {currentView === 'edit' && selectedUser && (
                        <UserForm
                            user={selectedUser}
                            mode="edit"
                            onSave={handleSaveUser}
                            onCancel={handleCancelForm}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

export default UserManagement;