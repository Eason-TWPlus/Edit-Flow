
import { ShowName, EditorName } from './types';

export const SHOWS: ShowName[] = [
  'Correspondents',
  'DC Insiders',
  'Finding Formosa',
  'In Case You Missed It',
  'Zoom In, Zoom Out',
  'Special Program'
];

export const EDITORS: EditorName[] = ['Dolphine', 'Eason', 'James'];

// 依照使用者要求更新剪輯師顏色
export const EDITOR_COLORS: Record<string, string> = {
  'Dolphine': '#F7C3D6',
  'Eason': '#edd97e',
  'James': '#80b3ff',
  'Unknown': '#DBD7D7'
};

// 為了相容性保留，但月曆將改用 EDITOR_COLORS
export const SHOW_COLORS: Record<ShowName, string> = {
  'Correspondents': 'bg-slate-900',
  'DC Insiders': 'bg-zinc-800',
  'Finding Formosa': 'bg-stone-700',
  'In Case You Missed It': 'bg-neutral-600',
  'Zoom In, Zoom Out': 'bg-gray-500',
  'Special Program': 'bg-black'
};

export const EDITOR_AVATARS: Record<EditorName, string> = {
  'Dolphine': 'https://picsum.photos/id/64/100/100',
  'Eason': 'https://picsum.photos/id/65/100/100',
  'James': 'https://picsum.photos/id/91/100/100'
};
