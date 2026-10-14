# 🎬 Elokuvasovellus

Web-ohjelmoinnin sovellusprojekti. Sovellus tarjoaa elokuvaharrastajille palvelun, jossa käyttäjät voivat etsiä elokuvia, kirjoittaa arvosteluja, luoda suosikkilistoja sekä osallistua elokuvaryhmiin.

Web-ohjelmoinnin sovellusprojekti  
Oulun ammattikorkeakoulu  
Syksy 2026

## Tiimi

- Jenni Seppälä
- Aleksi Vesterinen
- Arttu Peippo
- Daniil Bagirov

## Teknologiat

- Azure
- React
- Node.js
- PostgreSQL
- TMDB API

## Ominaisuudet

- Käyttäjän rekisteröityminen
- Käyttäjän kirjautuminen ja uloskirjautuminen
- Elokuvien haku TMDB-rajapinnasta
- Nyt elokuvateattereissa -näkymä
- Elokuvien arvostelu ja arvioiden selaaminen
- Suosikkilistojen luominen ja jakaminen
- Ryhmien luominen ja hallinta
- Responsiivinen käyttöliittymä 

## Projektin rakenne

frontend/     React-käyttöliittymä
backend/      Node.js REST API
database/     PostgreSQL-tietokanta
docs/         Dokumentaatio

## REST-dokumentaatio

Kaikki rajapinnat, pyyntöjen rungot, vastaukset ja virhekoodit on dokumentoitu Postmanilla:

**[Leffapiiri API – REST-dokumentaatio](https://documenter.getpostman.com/view/50576600/2sBYHRTfsw)**

- Perusosoite paikallisesti: `http://localhost:3001/api`
- Suojatut rajapinnat vaativat otsikon `Authorization: Bearer <token>`. Token saadaan kirjautumisesta (`POST /login`).
- Rajapinnat on ryhmitelty osioihin: Auth, Users, Movies, Reviews, Favorites, Groups ja Join requests.

## Yksikkötestit

REST-rajapintaa testataan automaattisilla yksikkötesteillä. Jokaiselle toiminnolle on sekä positiivisia että negatiivisia testejä.

| Toiminto | Rajapinta |
|---|---|
| Rekisteröityminen | `POST /api/register` |
| Kirjautuminen | `POST /api/login` |
| Uloskirjautuminen | `POST /api/logout` |
| Rekisteröitymisen poistaminen | `DELETE /api/users/me` |
| Arvostelujen selaaminen | `GET /api/reviews/:movieId` |

Testattavien rajapintojen pyynnöt, vastaukset ja virhekoodit on kuvattu [REST-dokumentaatiossa](https://documenter.getpostman.com/view/50576600/2sBYHRTfsw).

## Projektinhallinta

- **GitHub Projects ja [Issues](https://github.com/pulsarit-1/elokuvasovellus/issues)** kehitysjonon hallintaan
- **Git** versionhallintaan
- **Scrum** sprinttien suunnitteluun ja seurantaan

Tämä tuote käyttää TMDB:n rajapintaa, mutta TMDB ei ole hyväksynyt tai sertifioinut sitä.
