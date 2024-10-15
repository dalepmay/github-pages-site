import React, { useEffect, useState } from 'react';
import '../App.css';

function MTG() {
  const [sets, setSets] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  function clearSelectedCards() {
    setSelectedCards([]);
  }

  useEffect(() => {
    // Fetch the list of sets
    async function fetchSets() {
      try {
        const response = await fetch('https://api.scryfall.com/sets/');
        const data = await response.json();
        const sortedSets = data.data.sort((a, b) => a.name.localeCompare(b.name));
        setSets([...sortedSets]);
      } catch (error) {
        console.error('Error fetching sets:', error);
      }
    }
    fetchSets();
  }, []);

  useEffect(() => {
    if (selectedSet) {
      if (selectedSet === 'all-option') {
        if (searchTerm) {
          fetchAllCardsWithSearch();
        } else {
          fetchAllCards();
        }
      } else {
        fetchCardsBySet(selectedSet);
      }
    }
  }, [selectedSet, searchTerm]);

  async function fetchAllCards() {
    setLoading(true);
    try {
      let response = await fetch(`https://api.scryfall.com/cards/search?q=*&unique=cards`);
      let data = await response.json();
      let allCards = [...data.data];
      const totalCards = data.total_cards;
      while (data.has_more) {
        setLoadingMessage(`Loading ALL cards...[${allCards.length} of ${totalCards}]...`)
        await new Promise(resolve => setTimeout(resolve, 100));
        response = await fetch(`${data.next_page}`);
        data = await response.json();
        allCards = [...allCards, ...data.data];
      }
      const sortedCards = allCards.sort((a, b) => a.name.localeCompare(b.name));
      setCards(sortedCards);
    } catch (error) {
      console.error('Error fetching all cards:', error);
    }
    setLoading(false);
  }

  async function fetchAllCardsWithSearch() {
    setLoading(true);
    let searchedCards = [];
    let cardNames = new Set(); // Set to track card names
    let cardIdentifiers = new Set(); // Set to track unique card identifiers
    try {
      for (let sTerm of searchTerm.split(';')) {
        sTerm = sTerm.trim();
        if (sTerm.includes(' ')) { sTerm = sTerm.replace(' ', '+'); }
        if (sTerm != null && sTerm.length > 0) {
          const response = await fetch(`https://api.scryfall.com/cards/search?q=${sTerm}&unique=prints`);
          const data = await response.json();
          if (data.data) {
            for (let card of data.data) {

              // Don't add duplicate card name
              /* if (!cardNames.has(card.name)) {
                searchedCards.push(card);
                cardNames.add(card.name);
              } */

              // Don't add duplicate card name & set name
              const cardIdentifier = `${card.name}-${card.set_name}`;
              if (!cardIdentifiers.has(cardIdentifier)) {
                searchedCards.push(card);
                cardIdentifiers.add(cardIdentifier);
              }

            }
          }
        }
      }
      const sortedCards = searchedCards.sort((a, b) => a.name.localeCompare(b.name));
      setCards(sortedCards);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching all cards:', error);
      setLoading(false);
    }
  }

  async function fetchCardsBySet(setCode) {
    setLoading(true);
    try {
      const response = await fetch(`https://api.scryfall.com/cards/search?order=set&q=e%3A${setCode}&q=${searchTerm}&unique=prints`);
      const data = await response.json();
      const sortedCards = data.data.sort((a, b) => a.name.localeCompare(b.name));
      setCards(sortedCards);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cards by set:', error);
      setLoading(false);
    }
  }

  function handleCheckboxChange(card) {
    if (isSelected(card)) {
      setSelectedCards(selectedCards.filter(selectedCard => selectedCard.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  }

  function isSelected(card) {
    return selectedCards.some(selectedCard => selectedCard.id === card.id);
  }

  function handleCheckAll(event) {
    if (event.target.checked) {
      setSelectedCards(cards);
    } else {
      setSelectedCards([]);
    }
  }

  async function downloadSelectedImages(selectedCards) {
    for (const card of selectedCards) {
      const imageUrl = card.image_uris?.normal;
      const cardName = card.name;
      const setName = card.set_name && card.set_name.includes(':') ? `${card.set_name.replace(':', ' - ')}` : card.set_name;
      const cardType = `${card.type_line}`;

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        let fileName = `${cardName} - (${cardType}) - [${setName}].jpg`;
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Add a 100ms delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error downloading image:', error);
      }
    }
  }

  function handleSearchTermChange(event) {
    const inputValue = event.target.value;
    setSearchTerm(inputValue);
  }

  function handlePaste(event) {
    event.preventDefault();
    const paste = (event.clipboardData || window.clipboardData).getData('text');
    const processedValue = paste.split('\n').map(term => term.trim()).join(';');
    setSearchTerm(prev => prev ? `${prev};${processedValue}` : processedValue);
  }

  function handleSetChange(event) {
    if (event.target.value == null || event.target.value == '') {
      setCards([]);
    }
    setSelectedSet(event.target.value);
    clearSelectedCards();
  }

  function searchCards() {
    clearSelectedCards(); // Clear selected cards before initiating a new search
    const terms = searchTerm.split(';').map(term => term.trim());
    if (terms.length > 0) {
      fetchAllCardsWithSearch();
    }
  }

  return (
    <div className="text-center">
      <p className="text-xl">Magic: The Gathering</p>
      <p className="text-lg">Card List</p>
      <p className="mt-2">Select a Deck to show, or enter card names to search for (separated by semicolons)</p>
      <div>
        <select
          className="border border-gray-300 rounded"
          value={selectedSet}
          onChange={handleSetChange}
        >
          <option value="">Select a card set</option>
          {sets.map(set => (
            <option key={set.code} value={set.code}>
              {set.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <input
          size='50'
          className="border border-gray-300 mr-2 mt-2 px-2 rounded"
          type="text"
          value={searchTerm}
          onChange={handleSearchTermChange}
          onPaste={handlePaste}
          placeholder="Enter multiple search terms separated by semicolons...;"
        />
        <button className="bg-gray-200 border border-gray-500 px-2 rounded hover:bg-gray-300" onClick={searchCards}>Search</button>
      </div>
      {loading ? (
        <div className="loading">{loadingMessage}</div>
      ) : (
        <div className="table-container">
          {selectedCards.length > 0 &&
            <button className="bg-gray-200 border border-gray-300 mb-2 px-2 rounded hover:bg-gray-300" onClick={() => downloadSelectedImages(selectedCards)}>
              Download {selectedCards.length} Selected Images
            </button>
          }
          {cards.length > 0 && (
            <>
              {selectedCards.length == 0 && (<p>Check items to enable downloading</p>)}
              <table className="border mx-auto">
                <thead>
                  <tr className="border-2">
                    <th><input type="checkbox" onChange={handleCheckAll} /></th>
                    <th>Image</th>
                    <th>Card Title</th>
                    <th>Card Type</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <tr className="border divide-x divide-gray-300 odd:bg-gray-200" key={card.id}>
                      <td><input type="checkbox" checked={isSelected(card)} onChange={() => handleCheckboxChange(card)} /></td>
                      <td>
                        {card.image_uris?.small ? (
                          <a href={card.image_uris.large} target='_blank'><img src={card.image_uris?.small} alt={card.name} width="100" /></a>
                        ) : (
                          <span>No Image</span>
                        )}
                      </td>
                      <td className="px-2">{card.name}</td>
                      <td className="px-2">{card.type_line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MTG;
