import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { GemIcon } from './Icons';

export function GemChip() {
  const { data } = useStore();
  return (
    <Link to="/gems" className="gem-chip" aria-label={`${data.gems} Gems, open your Gems`}>
      <GemIcon />
      {data.gems}
    </Link>
  );
}
