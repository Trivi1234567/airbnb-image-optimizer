export enum RoomType {
  BEDROOM = 'bedroom',
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  LIVING_ROOM = 'living_room',
  EXTERIOR = 'exterior',
  OTHER = 'other'
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.BEDROOM]: 'Bedroom',
  [RoomType.KITCHEN]: 'Kitchen',
  [RoomType.BATHROOM]: 'Bathroom',
  [RoomType.LIVING_ROOM]: 'Living Room',
  [RoomType.EXTERIOR]: 'Exterior',
  [RoomType.OTHER]: 'Other'
};

export const ROOM_TYPE_COLORS: Record<RoomType, string> = {
  [RoomType.BEDROOM]: 'bg-blue-100 text-blue-800',
  [RoomType.KITCHEN]: 'bg-green-100 text-green-800',
  [RoomType.BATHROOM]: 'bg-purple-100 text-purple-800',
  [RoomType.LIVING_ROOM]: 'bg-orange-100 text-orange-800',
  [RoomType.EXTERIOR]: 'bg-yellow-100 text-yellow-800',
  [RoomType.OTHER]: 'bg-gray-100 text-gray-800'
};
