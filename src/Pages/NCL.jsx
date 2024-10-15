import React, { useEffect, useState } from 'react';

const ncl = 'https://www.ncl.com/cruises/';

const getTextBetween = (text, start, end) => {
    const startIndex = text.indexOf(start);
    if (startIndex === -1) return null;
    const endIndex = text.indexOf(end, startIndex + start.length);
    if (endIndex === -1) return null;
    let result = text.substring(startIndex + start.length, endIndex);
    if (result.startsWith('"')) { result = result.slice(1); }
    if (result.endsWith('"')) { result = result.slice(0, -1); }
    return result;
};

const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

const getHTML = (url) => {
    return fetch(url)
        .then(response => response.text())
        .catch(error => {
            console.error('Error fetching HTML for ' + url, error);
            return null;
        });
};

const getPageTitle = async (url) => {
    const source = await getHTML(url);
    if (source) {
        return getTextBetween(source, '<title>', '</title>');
    }
    return null;
}

const getItineraries = async (url) => {
    const source = await getHTML(url);
    if (source) {
        const sTest = getTextBetween(source, 'data-pricing-sailings=', 'data-pricing-offer-groups=');
        if (sTest) {
            const decodedDataString = decodeHtml(sTest).replace(/&quot;/g, '"');
            const firstCurlyBrace = decodedDataString.indexOf('[');
            const lastCurlyBrace = decodedDataString.lastIndexOf(']');
            const jsonString = decodedDataString.substring(firstCurlyBrace, lastCurlyBrace + 1);
            try {
                const cruiseData = JSON.parse(jsonString);
                return cruiseData;
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        } else {
            console.error('Failed to extract data string between markers');
        }
    }
    return null;
};

const convertTimestampToDate = (timestamp) => {
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });
};

const Ncl = () => {
    const [itineraries, setItineraries] = useState([]);
    const [stateroomTypes, setStateroomTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItineraries = async () => {
            const itinLinks = [
                //'JEWEL9SEASITSGYJNUICYKTNVICSEA',
                //'JOY9SEAKTNICYJNUSGYVICSEA',
                'BLISS7SEAJNUSGYKTNVICSEA',
            ];

            const allItineraries = [];
            const stateroomSet = new Set();

            for (const itin of itinLinks) {
                const cruiseData = await getItineraries(ncl + itin);
                if (cruiseData) {
                    for (const itinerary of cruiseData) {
                        let title = await getPageTitle(ncl + itinerary.itineraryCode);
                        title = title.replace('&amp;', '&');
                        const cruise = title.split(' from ')[0];
                        const from = title.split(' from ')[1].split(' on ')[0];
                        const ship = title.split(' from ')[1].split(' on ')[1].replace('Norwegian ', '');
                        const sailDate = convertTimestampToDate(itinerary.sailStartDate);
                        const staterooms = itinerary.staterooms;
                        staterooms.forEach(stateroom => stateroomSet.add(stateroom.title));
                        allItineraries.push({ cruise, from, ship, itineraryCode: itinerary.itineraryCode, sailDate, staterooms });
                    }
                }
            }

            setItineraries(allItineraries);
            setStateroomTypes(Array.from(stateroomSet));
            setLoading(false);
        };

        fetchItineraries();
    }, []);

    const renderItineraryRows = () => {
        const rows = [];
        let previousCruise = '';
        let previousFrom = '';
        // let previousShip = '';

        itineraries.forEach((itinerary, index) => {
            const same = itinerary.cruise === previousCruise && itinerary.from === previousFrom/*  && itinerary.ship === previousShip */;
            const rowSpan = itineraries.filter(it => it.cruise === itinerary.cruise && it.from === itinerary.from/*  && it.ship === itinerary.ship */).length;
            
            let booked = false;
            if (itinerary.sailDate === 'October 4, 2025') {
                booked = true;
            }
            
            const row = (
                <tr className="border even:bg-gray-200 odd:bg-gray-300" key={index}>
                    {!same && (
                        <td className="border border-gray-500 px-2" rowSpan={rowSpan}>
                            <div className="text-blue-700 underline"><a href={ncl + itinerary.itineraryCode} target='_blank'>{itinerary.cruise}</a></div>
                        </td>
                    )}
                    {!same && (
                        <td className="border border-gray-500 px-2" rowSpan={rowSpan}>{itinerary.from}</td>
                    )}
                    {/* {!same && (
                        <td className="border border-gray-500 px-2" rowSpan={rowSpan}>
                            {itinerary.ship}
                        </td>
                    )} */}
                    <td className={`${booked ? 'font-bold' : 'text-gray-400'} border border-black px-2`}>{itinerary.sailDate}</td>
                    {stateroomTypes.map((type, index) => {
                        const priceI = 1220; // was 682, pricing changed to include feex/taxes (538)
                        const priceB = 1662; // was 1116, pricing changed to include feex/taxes (546)
                        let totalDiff = 0;
                        if (type === 'Balcony' || type === 'Inside') {
                            const stateroom = itinerary.staterooms.find(s => s.title === type);
                            let price = '';
                            let color = '';
                            if (booked && stateroom.title === 'Inside' && stateroom.price !== priceI) {
                                totalDiff += (stateroom.price - priceI);
                                price = '*** $' + stateroom.price + ' *** (' + priceI + ')';
                                if (stateroom.price < priceI) {
                                    color = 'text-green-700';
                                } else {
                                    color = 'text-red-700';
                                }
                            } else if (booked && stateroom.title === 'Balcony' && stateroom.price !== priceB) {
                                totalDiff += (stateroom.price - priceB);
                                price = '*** $' + stateroom.price + ' *** (' + priceB + ')';
                                if (stateroom.price < priceB) {
                                    color = 'text-green-700';
                                } else {
                                    color = 'text-red-700';
                                }
                            } else {
                                price = '$ ' + stateroom.price;
                            }
                            return (
                                <td className={`${color} ${booked ? 'font-bold' : 'text-gray-400'} border border-black px-2 text-center`} key={index} title={totalDiff}>{price}</td>
                            );
                        }
                    })}
                </tr>
            );
            rows.push(row);
            previousCruise = itinerary.cruise;
            previousFrom = itinerary.from;
            //previousShip = itinerary.ship;
        });

        return rows;
    };

    return (
        <div className="relative">
            <style>
                {`
                .bg-image {
                    background-image: url('https://prnewswire2-a.akamaihd.net/p/1893751/sp/189375100/thumbnail/entry_id/0_hy5mi5v5/def_height/2700/def_width/2700/version/100012/type/1');
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed; /* Ensures the background stays fixed while scrolling */
                    background-repeat: no-repeat; /* Prevents the image from repeating */
                    opacity: 25%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                }
                `}
            </style>
            <div className="bg-image"></div>
            <div className="relative bg-opacity-25">
                <h2 className="text-center text-xl ">Alaska Cruises</h2>
                <h2 className="mb-2 text-center">* Prices are per person; rooms are double occupancy</h2>
                {loading && <p className="text-center">Loading cruise data...</p>}
            </div>
            {!loading &&
                <div className="relative bg-opacity-75">
                    <table className="border mx-auto">
                        <thead>
                            <tr className="border-2 border-gray-500 divide-x divide-gray-500">
                                <th>Cruise</th>
                                <th>From</th>
                                {/* <th>Ship</th> */}
                                <th>Sail Date</th>
                                {stateroomTypes.map((type, index) => (
                                    (type === 'Balcony' || type === 'Inside') ? <th key={index}>{type}</th> : null
                                    ))}
                            </tr>
                        </thead>
                        <tbody>
                            {renderItineraryRows()}
                        </tbody>
                    </table>
                </div>
            }
        </div>
    );
}

export default Ncl;
