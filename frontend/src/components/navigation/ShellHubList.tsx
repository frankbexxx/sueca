import React from 'react';

export interface ShellHubItem {
  id: string;
  label: string;
  hint?: string;
  onClick: () => void;
}

interface ShellHubListProps {
  items: ShellHubItem[];
}

export const ShellHubList: React.FC<ShellHubListProps> = ({ items }) => {
  return (
    <ul className="shell-hub-list">
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" className="shell-hub-item shell-panel" onClick={item.onClick}>
            <span className="shell-hub-item-label">{item.label}</span>
            {item.hint && <span className="shell-hub-item-hint">{item.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
};
