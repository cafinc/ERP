'use client';

import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, BriefcaseIcon, MapPinIcon } from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface Project {
  _id: string;
  name: string;
  customer: string;
  status: string;
}

export default function CrewCommunicationsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get crew ID from auth (mock for now)
  const crewId = 'crew-user-123';

  // Fetch assigned projects
  useEffect(() => {
    fetchProjects();
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects?crew_id=${crewId}`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchMessages = async (projectId: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/communications?project_id=${projectId}&type=inapp`
      );
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedProject) return;

    try {
      const payload: any = {
        project_id: selectedProject,
        message: messageText,
        type: 'inapp',
        crew_id: crewId
      };

      // Include location if available
      if (currentLocation) {
        payload.location = currentLocation;
      }

      const response = await fetch(`${BACKEND_URL}/api/communications/crew/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessageText('');
        fetchMessages(selectedProject);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Project Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">My Projects</h2>
          <p className="text-sm text-gray-500 mt-1">Select a project to communicate</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <BriefcaseIcon className="w-12 h-12 mx-auto mb-2" />
              <p>No active projects</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => {
                    setSelectedProject(project._id);
                    fetchMessages(project._id);
                  }}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedProject === project._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{project.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{project.customer}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      project.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {project.status}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location Status */}
        {currentLocation && (
          <div className="p-4 bg-blue-50 border-t border-blue-100">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <MapPinIcon className="w-4 h-4" />
              <span>Location tracking enabled</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {projects.find(p => p._id === selectedProject)?.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Project Communication</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start communicating with dispatch</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.crew_id === crewId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-lg rounded-2xl px-4 py-3 ${
                          msg.crew_id === crewId
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        {msg.location && (
                          <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            Location shared
                          </div>
                        )}
                        <span className="text-xs opacity-75 mt-1 block">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <BriefcaseIcon className="w-20 h-20 mx-auto mb-4" />
              <p className="text-xl font-medium">Select a project</p>
              <p className="text-sm mt-2">Choose a project from the sidebar to start communicating</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
