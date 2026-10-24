import type { Level } from './types';

/**
 * Nonogram picture library. '1' is a filled square. Pictures whose clues allow more than one
 * solution are skipped by the generator, so a drawing can be added without checking it by hand.
 * Set `reviewed: true` once a person has checked a picture reads as its title.
 */
export interface Picture {
  title: string;
  level: Level;
  rows: string[];
  memory: { text: string };
  reviewed: boolean;
}

export const PICTURES: Picture[] = [
  { title: 'A heart', level: 1, reviewed: true, memory: { text: 'A heart, carved into a school desk, next to two sets of initials and a date nobody remembers.' },
    rows: ['01010', '11111', '11111', '01110', '00100'] },
  { title: 'A house', level: 1, reviewed: false, memory: { text: 'Every child’s drawing of home had a pointed roof, a chimney and a path up to the front door.' },
    rows: ['00100', '01110', '11111', '01010', '01110'] },
  { title: 'A key', level: 1, reviewed: false, memory: { text: 'The spare key lived under a flowerpot, and everyone on the street knew which one.' },
    rows: ['01110', '01010', '01110', '00100', '00110'] },
  { title: 'An arrow', level: 1, reviewed: false, memory: { text: 'Road signs, weather vanes and treasure maps: arrows told you where to go long before a phone did.' },
    rows: ['00100', '00110', '11111', '00110', '00100'] },
  { title: 'A tree', level: 1, reviewed: false, memory: { text: 'Conkers, climbing and a rope swing: one good tree could fill a whole summer holiday.' },
    rows: ['01110', '11111', '01110', '00100', '01110'] },
  { title: 'A teacup', level: 2, reviewed: false, memory: { text: 'The good teacups came out for visitors, and went straight back in the cabinet afterwards.' },
    rows: ['0000000', '1111100', '1111111', '1111101', '1111110', '0111000', '1111111'] },
  { title: 'An umbrella', level: 2, reviewed: false, memory: { text: 'Umbrellas were left on buses so often that lost-property offices had whole rooms of them.' },
    rows: ['0011100', '0111110', '1111111', '0001000', '0001000', '0101000', '0011000'] },
  { title: 'A bell', level: 2, reviewed: false, memory: { text: 'The school bell decided everything: when you came in, when you went out, and when the test was over.' },
    rows: ['0001000', '0011100', '0111110', '0111110', '0111110', '1111111', '0001000'] },
  { title: 'An envelope', level: 2, reviewed: false, memory: { text: 'A letter on the mat was the best part of the morning, especially in handwriting you knew.' },
    rows: ['1111111', '1100011', '1010101', '1001001', '1000001', '1111111', '0000000'] },
  { title: 'A kettle', level: 3, reviewed: false, memory: { text: 'The kettle went on the moment anyone came through the door, whether they wanted tea or not.' },
    rows: ['0000110000', '0001111000', '0000110000', '0111111110', '1111111111', '1111111111', '1111111111', '1111111111', '0111111110', '0011111100'] },
  { title: 'A radio', level: 3, reviewed: false, memory: { text: 'The wireless sat in pride of place, and the whole family gathered round it for the evening programmes.' },
    rows: ['0000000110', '0000011000', '0001100000', '1111111111', '1100000011', '1011101101', '1011100011', '1011101101', '1100000011', '1111111111'] },
  { title: 'A sailing boat', level: 3, reviewed: false, memory: { text: 'Paper boats on the park pond, wooden ones in the bath, and a real one if you were lucky on holiday.' },
    rows: ['0000100000', '0001100000', '0011100000', '0111100000', '1111100000', '0000100000', '1111111111', '0111111110', '0011111100', '0000000000'] },
];
