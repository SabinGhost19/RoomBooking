/**
 * ParticipantSelector Component
 * Multi-select dropdown for selecting booking participants
 */
import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, X, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { UserResponse } from '@/lib/api';
import { userAPI } from '@/lib/api';

interface ParticipantSelectorProps {
  selectedParticipants: number[];
  onParticipantsChange: (participantIds: number[]) => void;
  maxParticipants?: number;
  currentUserId?: number;
  disabled?: boolean;
}

export default function ParticipantSelector({
  selectedParticipants,
  onParticipantsChange,
  maxParticipants,
  currentUserId,
  disabled = false,
}: ParticipantSelectorProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await userAPI.getAllUsers({
        search: searchQuery || undefined,
        limit: 50,
      });
      // Filter out current user from the list
      const filteredUsers = currentUserId
        ? fetchedUsers.filter((user) => user.id !== currentUserId)
        : fetchedUsers;
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedUsers = users.filter((user) =>
    selectedParticipants.includes(user.id)
  );

  const toggleParticipant = (userId: number) => {
    const isSelected = selectedParticipants.includes(userId);
    if (isSelected) {
      onParticipantsChange(selectedParticipants.filter((id) => id !== userId));
    } else {
      // Check if we've reached max participants
      if (maxParticipants && selectedParticipants.length >= maxParticipants) {
        return;
      }
      onParticipantsChange([...selectedParticipants, userId]);
    }
  };

  const removeParticipant = (userId: number) => {
    onParticipantsChange(selectedParticipants.filter((id) => id !== userId));
  };

  const remainingCapacity = maxParticipants
    ? maxParticipants - selectedParticipants.length
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Additional Participants (Optional)
        </label>
        {maxParticipants && (
          <span className="text-xs text-gray-500">
            {remainingCapacity} {remainingCapacity === 1 ? 'spot' : 'spots'} remaining
          </span>
        )}
      </div>

      {/* Selected Participants Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md min-h-[40px]">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="text-xs">{user.full_name || user.username}</span>
              <button
                type="button"
                onClick={() => removeParticipant(user.id)}
                disabled={disabled}
                className="ml-1 rounded-full p-0.5 hover:bg-gray-300 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Participant Selector Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || (maxParticipants !== undefined && remainingCapacity === 0)}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {selectedParticipants.length === 0
                ? 'Select participants...'
                : `${selectedParticipants.length} selected`}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandEmpty>
              {loading ? 'Loading...' : 'No users found.'}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {users.map((user) => {
                const isSelected = selectedParticipants.includes(user.id);
                const isDisabled =
                  !isSelected &&
                  maxParticipants !== undefined &&
                  selectedParticipants.length >= maxParticipants;

                return (
                  <CommandItem
                    key={user.id}
                    value={`${user.id}`}
                    onSelect={() => {
                      if (!isDisabled) {
                        toggleParticipant(user.id);
                      }
                    }}
                    disabled={isDisabled}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 cursor-pointer',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.full_name || user.username}
                      </span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {maxParticipants && remainingCapacity === 0 && (
        <p className="text-xs text-amber-600">
          Maximum capacity reached. Remove participants to add more.
        </p>
      )}
    </div>
  );
}
