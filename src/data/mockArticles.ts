import { Article, PollData, VideoItem } from '../types';

// Clean initial state: Starts from 0 sample content as requested
export const INITIAL_ARTICLES: Article[] = [];

export const MOCK_VIDEOS: VideoItem[] = [];

export const INITIAL_POLL: PollData = {
  id: 'poll-2026-1',
  topic: 'Polling Opini Publik',
  question: 'Menurut Anda, apa sektor paling mendesak yang harus diprioritaskan demi percepatan Indonesia Emas 2045?',
  endDate: '31 Agustus 2026',
  options: [
    { id: 'opt-1', text: 'Pendidikan Berkualitas & Kesejahteraan Tenaga Pendidik', votes: 0 },
    { id: 'opt-2', text: 'Kedaulatan Pangan & Revitalisasi Pertanian Modern', votes: 0 },
    { id: 'opt-3', text: 'Pemberantasan Korupsi & Kepastian Hukum Bersih', votes: 0 },
    { id: 'opt-4', text: 'Transisi Energi Hijau & Penguatan Riset Teknologi', votes: 0 }
  ]
};

export const HOT_TAGS = [
  '#IndonesiaEmas2045',
  '#ReformasiBirokrasi',
  '#MahasiswaBergerak',
  '#PendidikanUntukSemua',
  '#UMKMJuara',
  '#TransisiEnergi',
  '#KedaulatanPangan',
  '#JurnalismePublik'
];
