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
  { title: 'A star', level: 1, reviewed: false, memory: { text: 'A gold star on your work was the best thing a teacher could give you.' },
    rows: ['00100', '11111', '01110', '01010', '10001'] },
  { title: 'A smiling face', level: 1, reviewed: false, memory: { text: 'Smiley faces turned up on badges, T-shirts and the corner of every note passed in class.' },
    rows: ['01010', '01010', '00000', '10001', '01110'] },
  { title: 'A little boat', level: 1, reviewed: false, memory: { text: 'A rowing boat on the boating lake, hired by the half hour, and somebody always splashed.' },
    rows: ['00100', '00110', '00100', '11111', '01110'] },
  { title: 'A toadstool', level: 1, reviewed: false, memory: { text: 'Red with white spots, and in every picture book a fairy or a gnome lived underneath it.' },
    rows: ['01110', '11111', '10101', '00100', '01110'] },
  { title: 'A mug', level: 1, reviewed: false, memory: { text: 'Everyone had their own mug, and woe betide anyone who used it.' },
    rows: ['11110', '10011', '10011', '11110', '11100'] },
  { title: 'A fish', level: 2, reviewed: false, memory: { text: 'A goldfish won at the fair came home in a plastic bag and lived for years.' },
    rows: ['0000000', '0111001', '1111011', '1011111', '1111011', '0111001', '0000000'] },
  { title: 'A kite', level: 2, reviewed: false, memory: { text: 'A windy Sunday on the hill, a kite with a tail of bows, and string wound round a stick.' },
    rows: ['0001000', '0011100', '0111110', '1111111', '0111110', '0011100', '0001010'] },
  { title: 'A candle', level: 2, reviewed: false, memory: { text: 'When the lights went out, the candles came out of the drawer, and the evening felt like an adventure.' },
    rows: ['0001000', '0001000', '0011100', '0011100', '0011100', '0011100', '0111110'] },
  { title: 'A teapot', level: 3, reviewed: false, memory: { text: 'Warm the pot first, one spoonful each and one for the pot, then let it stand.' },
    rows: ['00010000', '00111000', '01111111', '11111101', '01111101', '01111111', '01111100', '00111000'] },
  { title: 'A kettle', level: 3, reviewed: false, memory: { text: 'The kettle went on the moment anyone came through the door, whether they wanted tea or not.' },
    rows: ['00111100', '01000010', '00111100', '01111110', '01111111', '01111110', '01111110', '11111111'] },
  { title: 'A cottage', level: 3, reviewed: false, memory: { text: 'A pointed roof, a chimney and a door in the middle: the house every child drew.' },
    rows: ['00010010', '00111010', '01111110', '11111111', '01000010', '01011010', '01011010', '01111110'] },
  { title: 'An apple', level: 3, reviewed: false, memory: { text: 'An apple for the teacher, polished on a jumper sleeve on the way to school.' },
    rows: ['00011000', '00010000', '01111110', '11111111', '11111111', '11111111', '01111110', '00111100'] },
  { title: 'A sailing boat', level: 3, reviewed: false, memory: { text: 'Paper boats on the park pond, wooden ones in the bath, and a real one if you were lucky on holiday.' },
    rows: ['00010000', '00011000', '00011100', '00011110', '00010000', '11111111', '01111110', '00111100'] },
];
