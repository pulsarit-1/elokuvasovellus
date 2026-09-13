# REST-dokumentaatio

## Projekti

Elokuvasovellus

Backend:

- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt
- TMDB API

Perusosoite:

```text
http://localhost:3001/api
```

---

# Autentikointi

## Rekisteröityminen

### POST /register

Luo uuden käyttäjän.

### Request

```json
{
  "email": "test@testi.fi",
  "password": "Salasana123"
}
```

### Response

```json
{
  "status": "ok",
  "user": {
    "id": 1,
    "email": "test@testi.fi"
  }
}
```

---

## Kirjautuminen

### POST /login

Kirjaa käyttäjän sisään.

### Request

```json
{
  "email": "test@testi.fi",
  "password": "Salasana123"
}
```

### Response

```json
{
  "status": "ok",
  "token": "JWT_TOKEN"
}
```

---

# Käyttäjät

## Hae oman käyttäjän tiedot

### GET /users/me

Vaatii JWT-tokenin.

### Header

```text
Authorization: Bearer JWT_TOKEN
```

### Response

```json
{
  "id": 1,
  "email": "test@testi.fi",
  "created_at": "2026-09-13T12:00:00.000Z"
}
```

---

## Poista oma käyttäjätili

### DELETE /users/me

Vaatii JWT-tokenin.

### Header

```text
Authorization: Bearer JWT_TOKEN
```

### Response

```json
{
  "status": "ok",
  "message": "Käyttäjä poistettu"
}
```

---

## Julkinen suosikkilista

### GET /users/:id/favorites

### Esimerkki

```http
GET /users/1/favorites
```

### Response

```json
[
  {
    "movie_id": 550
  }
]
```

---

# Elokuvat

## Hae elokuvia

### GET /movies/search?q=batman

### Response

```json
[
  {
    "id": 268,
    "title": "Batman"
  }
]
```

---

## Nyt elokuvateattereissa

### GET /movies/now-playing

### Response

```json
[
  {
    "id": 969681,
    "title": "Spider-Man: Brand New Day"
  }
]
```

---

## Hae yksittäinen elokuva

### GET /movies/:id

### Esimerkki

```http
GET /movies/550
```

### Response

```json
{
  "id": 550,
  "title": "Fight Club"
}
```

---

# Arvostelut

## Lisää arvostelu

### POST /reviews

Vaatii JWT-tokenin.

### Header

```text
Authorization: Bearer JWT_TOKEN
```

### Request

```json
{
  "movie_id": 550,
  "rating": 5,
  "review_text": "Loistava elokuva"
}
```

### Response

```json
{
  "id": 1,
  "movie_id": 550,
  "rating": 5,
  "review_text": "Loistava elokuva"
}
```

---

## Hae elokuvan arvostelut

### GET /reviews/:movieId

### Esimerkki

```http
GET /reviews/550
```

### Response

```json
[
  {
    "rating": 5,
    "review_text": "Loistava elokuva",
    "email": "test@testi.fi"
  }
]
```

---

# Ryhmät

## Hae kaikki ryhmät

### GET /groups

### Response

```json
[
  {
    "id": 1,
    "name": "Marvel-fanit"
  }
]
```

---

## Hae yksi ryhmä

### GET /groups/:id

### Response

```json
{
  "id": 1,
  "name": "Marvel-fanit",
  "owner_id": 2
}
```

---

## Luo uusi ryhmä

### POST /groups

Vaatii JWT-tokenin.

### Header

```text
Authorization: Bearer JWT_TOKEN
```

### Request

```json
{
  "name": "Marvel-fanit"
}
```

### Response

```json
{
  "id": 1,
  "name": "Marvel-fanit",
  "owner_id": 2
}
```

---

## Poista ryhmä

### DELETE /groups/:id

Vaatii JWT-tokenin.

### Response

```json
{
  "status": "ok"
}
```

---

# Ryhmän jäsenet

## Liity ryhmään

### POST /groups/:id/join

Vaatii JWT-tokenin.

### Header

```text
Authorization: Bearer JWT_TOKEN
```

### Response

```json
{
  "group_id": 1,
  "user_id": 2
}
```

---

## Hae ryhmän jäsenet

### GET /groups/:id/members

### Response

```json
[
  {
    "user_id": 2,
    "email": "test@testi.fi"
  }
]
```

---

## Poista jäsen ryhmästä

### DELETE /groups/:groupId/members/:userId

Vaatii JWT-tokenin.

### Response

```json
{
  "status": "ok"
}
```

---

# Liittymispyynnöt

## Lähetä liittymispyyntö

### POST /groups/:id/request

Vaatii JWT-tokenin.

### Header

```text
Authorization: Bearer JWT_TOKEN
```

### Response

```json
{
  "status": "pending"
}
```

---

## Hae liittymispyynnöt

### GET /groups/:id/requests

### Response

```json
[
  {
    "id": 1,
    "email": "test@testi.fi",
    "status": "pending"
  }
]
```

---

## Hyväksy liittymispyyntö

### PATCH /requests/:id/approve

Vaatii JWT-tokenin.

### Response

```json
{
  "status": "approved"
}
```

---

## Hylkää liittymispyyntö

### PATCH /requests/:id/reject

Vaatii JWT-tokenin.

### Response

```json
{
  "status": "rejected"
}
```

---

# Tietokanta

Projektissa käytettävät taulut:

```text
users
reviews
favorites
groups
group_members
join_requests
```

## users

Käyttäjätiedot

- id
- email
- password_hash
- created_at

## reviews

Elokuvien arvostelut

- id
- user_id
- movie_id
- rating
- review_text
- created_at

## favorites

Käyttäjien suosikit

- id
- user_id
- movie_id
- created_at

## groups

Käyttäjien ryhmät

- id
- name
- owner_id
- created_at

## group_members

Ryhmien jäsenet

- id
- group_id
- user_id
- created_at

## join_requests

Ryhmään liittymispyynnöt

- id
- group_id
- user_id
- status
- created_at