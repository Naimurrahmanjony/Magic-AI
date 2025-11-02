import React from 'react';

interface SidebarProps {
  inventory: string[];
  quest: string;
  questTitle: string;
  inventoryTitle: string;
  emptyInventoryText: string;
  startQuestText: string;
  fontClass: string;
}

const CompassIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17.25l3 3m0 0l3-3m-3 3V3.75M9 3.75h6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const BackpackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ inventory, quest, questTitle, inventoryTitle, emptyInventoryText, startQuestText, fontClass }) => {
  return (
    <aside className="w-full md:w-1/4 lg:w-1/5 bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-cyan-300 font-cinzel">
          <CompassIcon />
          {questTitle}
        </h2>
        <p className={`text-gray-300 italic ${fontClass}`}>{quest || startQuestText}</p>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center text-amber-300 font-cinzel">
          <BackpackIcon />
          {inventoryTitle}
        </h2>
        {inventory.length > 0 ? (
          <ul className={`space-y-2 ${fontClass}`}>
            {inventory.map((item, index) => (
              <li key={index} className="bg-gray-700/50 p-2 rounded-md text-gray-200">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className={`text-gray-400 ${fontClass}`}>{emptyInventoryText}</p>
        )}
      </div>
    </aside>
  );
};