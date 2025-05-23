import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/CategoryPage.css';
import { TM_API_KEY as API_KEY } from '../config';

export default function CategoryPage() { //Henter data fra URL
  const { slug } = useParams();

  // Oversett til engelsk for bruk i API
  const categoryMap = {
    musikk: 'music',
    teater: 'theatre',
    sport: 'sports',
  };

  const translatedCategory = categoryMap[slug.toLowerCase()] || slug; // Hvis slug matcher en av kategoriene i categoryMap, oversetter vi den til engelsk. Hvis ikke, bruker vi slug som den er.

  const [events, setEvents] = useState([]); //arrys til å lagre fetched data
  const [artists, setArtists] = useState([]);
  const [venues, setVenues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(''); // filter funksjon - dato
  const [selectedCity, setSelectedCity] = useState(''); // By
  const [selectedCountry, setSelectedCountry] = useState(''); //Land

  const [searchTerm, setSearchTerm] = useState('');
  const [searchClick, setSearchClick] = useState(false);

  const SearchClick = () => {
    setSearchClick(prev => !prev); //prev er den forrige verdien av searchClick, noe som gjør at den toggler mellom true og false. 
  };

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const base = 'https://app.ticketmaster.com/discovery/v2/';
        let query = `?apikey=${API_KEY}&keyword=${translatedCategory}&size=6`; 

        /*dato filter
         if (selectedDate) {
          const isoDate = new Date(selectedDate).toISOString(); // konverterer til ISO-format fordi Ticketmaster krever det. 
          query += `&startDateTime=${isoDate}`;
        }
          !Fjernet dato filteret, fulstending forklaring i eksamensdokumentasjonen.
        */

       if (translatedCategory) {
          query += `&keyword=${encodeURIComponent(translatedCategory)}`;
        }

        if (searchTerm) {
          query += `&keyword=${encodeURIComponent(searchTerm)}`;
        }

        //By filter
        if (selectedCity) {
          query += `&city=${selectedCity}`;
        }

        //Land filter
        if (selectedCountry) {
          query += `&countryCode=${selectedCountry}`;
        }

        /*const [eventRes, artistRes, venueRes] = await Promise.all([ //promise.all - henter flere forespørseler samtidig (som nå fører til error 429)
          fetch(base + 'events.json' + query), // query er en del av URLen som inneholder apikey og søkeord
          fetch(base + 'attractions.json' + query),
          fetch(base + 'venues.json' + query)
        ]);
        Her er det AI, "console insight" på google chrome, som forslo å prøve setTimeout.
        i forbindelse med 429 feilmeldingen.

        setTimeout sørger for at hver forespørsel blir forsinket med 500ms, slik at alle forespørslene ikke blir sendt samtidig.
        */
       
        const eventRes = await fetch(base + 'events.json' + query);
        await new Promise(resolve => setTimeout(resolve, 500));

        const artistRes = await fetch(base + 'attractions.json' + query);
        await new Promise(resolve => setTimeout(resolve, 500));

        const venueRes = await fetch(base + 'venues.json' + query);


        const eventData = await eventRes.json(); //await sørger for at dataene er hentet før vi prøver å bruke dem (ettersom fetch er asynkront)
        const artistData = await artistRes.json();
        const venueData = await venueRes.json();

        setEvents(eventData._embedded?.events || []); // optional chaining - sjekker om _embedded og events finnes før vi prøver å bruke dem. Hvis de ikke finnes, settes dem til en tom array.
        setArtists(artistData._embedded?.attractions || []); // fallback til tom array hvis det ikke finnes data. 
        setVenues(venueData._embedded?.venues || []);
        /* 
        Optional chaining er brukt sammen med fallback. 
        Hvis en egenskap er undefined eller null vil det ikke bli kastet en feil, men returnere undefined. 
        Ettersom vi i tilegg bruker || [] (fallback) vil dette igjen erstatte undefined med en tom array. 
        Dette sikrer at vi kan fortsette å utføre f.eks .map() uten å få en feil.
        */
      } catch (err) {
        setError(err);
      } finally { // Når alle forespørslene er fullført, setter vi loading til false - 
        setLoading(false);
      }
    }

    fetchAll();
    // eslint-disable-next-line
  }, [translatedCategory, selectedCity, selectedCountry, searchClick ]); // useEffect vil kjøre på nytt når noen av disse verdiene endres.

  // slug.charAt(0).toUpperCase() + slug.slice(1) - tar første bokstav og gjør den stor, dermed legger til resten av strengen.
   return (
    <main className="category-page">
      <h1>{slug.charAt(0).toUpperCase() + slug.slice(1)}</h1> 

      {/* filter section, Uten funksjonalitet */}
      <section className="filter-bar">
        <label>
         Dato:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>

        <label>
          Land:
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
            <option value="">Alle</option>
            <option value="NO">Norge</option>
            <option value="DK">Danmark</option>
            <option value="SE">Sverige</option>
          </select>
        </label>

        <label>
          By:
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="">Alle</option>
            <option value="Oslo">Oslo</option>
            <option value="København">København</option>
            <option value="Stockholm">Stockholm</option>
          </select>
        </label>

        <label>
          Søk:
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Søk etter arrangement, artist eller sted"
          />
        </label>

        <button onClick={SearchClick}>Søk</button>
      </section>
  

      {loading && <p>Laster inn...</p>}
      {error && <p>Feil: {error.message}</p>}
      
      {/*Bruker map til å gå igjennom events, dermed viser images, names, and dates.*/}
      <section>
        <h2>Arrangementer</h2>
        <div className="event-grid">
          {events.map(e => (
            <div key={e.id} className="event-card">
              <img src={e.images?.[0]?.url} alt={e.name} />
              <h3>{e.name}</h3>
              <p>{e.dates?.start?.localDate}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Attraksjoner</h2>
        <div className="event-grid">
          {artists.map(a => (
            <div key={a.id} className="event-card">
              <img src={a.images?.[0]?.url} alt={a.name} />
              <h3>{a.name}</h3>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Spillesteder</h2>
        <div className="event-grid">
          {venues.map(v => (
            <div key={v.id} className="event-card">
              <h3>{v.name}</h3>
              <p>{v.city?.name}, {v.country?.name}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
