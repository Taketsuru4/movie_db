const API_KEY = "e9743f65";
const form = document.getElementById("search-form");
const input = document.getElementById("q");
const resultsEl = document.getElementById("results");
const stateEl = document.getElementById("state");

/* ===== Search flow ===== */
form.addEventListener("submit", onSearch);

async function onSearch(e){
  e.preventDefault();
  const query = (input.value || "").trim();
  if(!API_KEY || API_KEY.includes("e9743f65_")) return setState("Please set your OMDb API key in movies.js");
  if(!query){ resultsEl.innerHTML = ""; return setState("Please enter a movie title."); }

  setState("Loading…");
  resultsEl.innerHTML = "";
  try {
    const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie&page=1`;
    const res = await fetch(url, { cache:"no-store" });
    if(!res.ok) return setState(`HTTP ${res.status} – check network / key`);
    const data = await res.json();
    if(data.Response === "False") return setState(data.Error || "No results.");
    setState("");
    renderMovies(data.Search || []);
  } catch(err){
    console.error(err);
    setState("Network error. Try again.");
  }
}

function setState(msg=""){ stateEl.textContent = msg; }

function renderMovies(list){
  resultsEl.innerHTML = "";
  list.forEach(m => {
    const poster = m.Poster && m.Poster !== "N/A"
      ? m.Poster
      : "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450'><rect width='100%' height='100%' fill='#0f172a'/><text x='50%' y='50%' fill='#64748b' font-family='Arial' font-size='18' text-anchor='middle'>No Poster</text></svg>`);
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.imdbid = m.imdbID;                 // <-- κρατάμε το ID
    card.innerHTML = `
      <img class="poster" src="${poster}" alt="${escapeHtml(m.Title)} poster"/>
      <div class="card-body">
        <h3 class="title" title="${escapeHtml(m.Title)}">${escapeHtml(m.Title)}</h3>
        <div class="meta">
          <span>${m.Year || ""}</span>
          <span>${m.Type ? cap(m.Type) : ""}</span>
          <span>${m.imdbID ? "#" + m.imdbID : ""}</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => openMovieDetails(m.imdbID));
    resultsEl.appendChild(card);
  });
}

/* ===== Details (second fetch by imdbID) ===== */
async function openMovieDetails(imdbID){
  toggleModal(true);                      // open immediately (feels fast)
  setModalContent(loadingMarkup());       // loading skeleton

  try{
    const url = `https://www.omdbapi.com/?apikey=${API_KEY}&i=${encodeURIComponent(imdbID)}&plot=full`;
    const res = await fetch(url, { cache:"no-store" });
    if(!res.ok) return setModalContent(errorMarkup(`HTTP ${res.status}`));
    const data = await res.json();
    if(data.Response === "False") return setModalContent(errorMarkup(data.Error || "Not found"));

    setModalContent(detailsMarkup(data));
  }catch(err){
    console.error(err);
    setModalContent(errorMarkup("Network error"));
  }
}

/* ===== Modal helpers ===== */
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");

function toggleModal(open){
  modal.setAttribute("aria-hidden", open ? "false" : "true");
  modal.classList.toggle("is-open", !!open);
  if(open){
    document.addEventListener("keydown", onEsc);
  }else{
    document.removeEventListener("keydown", onEsc);
  }
}
function onEsc(e){ if(e.key === "Escape") toggleModal(false); }

modal.addEventListener("click", (e) => {
  if(e.target.dataset.close === "true") toggleModal(false);
});

function setModalContent(html){
  modalContent.innerHTML = html;
}

function loadingMarkup(){
  return `<div class="state">Loading details…</div>`;
}
function errorMarkup(msg){
  return `<div class="state">${escapeHtml(msg)}</div>`;
}

function detailsMarkup(d){
  const poster = d.Poster && d.Poster !== "N/A" ? d.Poster : "";
  const tags = [
    d.Rated && `Rated: ${d.Rated}`,
    d.Runtime,
    d.Genre,
    d.Released && `Released: ${d.Released}`
  ].filter(Boolean).map(t => `<span>${escapeHtml(t)}</span>`).join("");

  return `
    <div class="movie-details">
      ${poster ? `<img src="${poster}" alt="${escapeHtml(d.Title)} poster">` : ""}
      <div>
        <h2>${escapeHtml(d.Title)} (${escapeHtml(d.Year||"")})</h2>
        <div class="movie-meta">
          <span>IMDB: ${escapeHtml(d.imdbRating || "N/A")}</span>
          <span>Votes: ${escapeHtml(d.imdbVotes || "N/A")}</span>
          <span>ID: ${escapeHtml(d.imdbID || "")}</span>
        </div>
        <div class="movie-tags">${tags}</div>
        <p class="movie-plot">${escapeHtml(d.Plot || "No plot available.")}</p>
        <p class="movie-meta"><strong>Director:</strong>&nbsp;${escapeHtml(d.Director || "—")}</p>
        <p class="movie-meta"><strong>Actors:</strong>&nbsp;${escapeHtml(d.Actors || "—")}</p>
        <p class="movie-meta"><strong>Language:</strong>&nbsp;${escapeHtml(d.Language || "—")}</p>
        <p class="movie-meta"><strong>Country:</strong>&nbsp;${escapeHtml(d.Country || "—")}</p>
      </div>
    </div>
  `;
}

/* ===== Small utils ===== */
function cap(s){ return (s||"").charAt(0).toUpperCase() + (s||"").slice(1); }
function escapeHtml(str=""){ return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }