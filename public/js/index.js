// Search Functions

// Get data based on Global Preference
async function search(searchTerm) {
    try {
        const data = await fetch(whichSearch(searchTerm)).then((response) => response.json());
        console.log(data);
        return data;
    } catch (error) {
        console.error(`Couldn't fetch the ${searchTerm} pokémon.`, error);
    }
}

// Get data when nothing is given
async function searchAll(limit, offset) {
    try {
        const rawResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const rawData = await rawResponse.json();

        // URL Pool
        const urlArray = rawData.results.map((element) => element.url);

        const data = await Promise.all(
            urlArray.map((url) => fetch(url))
        ).then((response) => Promise.all(response.map((data) => data.json())))

        return data;
    } catch (error) {
        console.error(`Couldn't fetch.\n`, error)
    }
}

// Controls the Global Search preference
function whichSearch(searchTerm) {
    switch (globalPreference) {
        case 'pokemon':
            return `https://pokeapi.co/api/v2/pokemon/${searchTerm}`
        case 'type':
            return `https://pokeapi.co/api/v2/type/${searchTerm}`
    }
}


// DOM

// General DOM Elements
const root   = document.getElementById("root");
const searchBox = document.getElementById("search__input");
let globalPreference = 'pokemon';
let searchTerm = searchBox.value;

// Size Parameter Parsing
const _pokemonLimit = document.getElementById("limit");
const _pokemonOffset = document.getElementById("offset");

// Todo
(function parseURLParams() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('limit') && urlParams.has('offset')) {
        _pokemonLimit.value = urlParams.get('limit');
        _pokemonOffset.value = urlParams.get('offset');
    } else {
        _pokemonLimit.value = 100;
        _pokemonOffset.value = 649;
    }
})();


const gallery = {
    render: async (data) => {
        // Card Creation
        for (let i in data) {
            try {
                let { id, name, weight } = data[i]
                let { front_default } = data[i].sprites.other.home
                let unformattedTypes = data[i].types
                let types = typesToString(unformattedTypes)

                name = parseName(name);

                // Card Creation
                let card = document.createElement("article");
                card.classList.add("pokemon")
                card.setAttribute("type", unformattedTypes[0].type.name)
                card.setAttribute("tabindex", 0)
                root.appendChild(card);
                card.innerHTML = 
                `
                <div class="pokemon__id">${id}</div>
                <div class="pokemon__types">   
                    ${typesToHTML(unformattedTypes)}
                </div>
                <div class="pokemon__name">${name.toUpperCase()}</div>
                <img class="pokemon__image" src="${front_default}" name="${name}"/>
                <div class="pokemon__attributes">
                    <div class="pokemon__attribute">
                        <span class="pokemon__attribute--title">Weight: </span>
                        <span class="pokemon__attribute--type">${weight.toString().slice(0, -1) + ',' + weight.toString().slice(-1) }kg</span>
                    </div>
                    <div class="pokemon__attribute">
                        <span class="pokemon__attribute--title">Types: </span>
                        <span class="pokemon__attribute--type">${types}</span>
                    </div>
                </div>
                `
                console.log(`[${i}] Rendered ${name}'s card.`)
            } catch (error) {
                console.log("Couldn't render this card because of ", error)
            }
        }

        // Pokemon Image EventListener
        let pokemonImages = document.querySelectorAll(".pokemon__image");
        pokemonImages.forEach((pokemon) => {
            pokemon.addEventListener("click", () => {
                window.open(`https://bulbapedia.bulbagarden.net/wiki/${pokemon.getAttribute("name")}_(Pok%C3%A9mon)`)
            })
        });

        // Cleanup
        data = [];
        pokemonImages = [];
    },
    search: async () => {
        searchTerm = searchBox.value;

        // Avoid searching again while it's still searching
        if (searching == true) { return; }
        searching = true;

        // Alphabet regex
        const alphabetRegex = new RegExp("/[A-Za-z]/");

        // Rendering
        if (searchTerm == "") {
            gallery.reload()
            const data = await searchAll(_pokemonLimit.value, _pokemonOffset.value);
            // const data = await searchAll(_pokemonLimit.value, _pokemonOffset.value);
            gallery.render(data)
        } else {
            gallery.reload()
            const data = await search(searchTerm);
            gallery.render(data)
            setTimeout(() => { searching = false }, 2000);
        }
    }, // Search
    reload: () => {
        const pokedex = document.querySelectorAll(".pokemon");

        if (pokedex.length == 0) { return; }

        pokedex.forEach(pokemon => {
            pokemon.remove();
        });

        console.clear();
    } // Reload
}


// Util Functions

function parseName(name) {
    for (let i = 0; i < name.length; i++) {
        if (name[i] == "-") {
            name = name.slice(0, i)
        }
    }
    return name;
}

function typesToHTML(types) {
    if (types.length == 1) {
        return (`
            <div class="pokemon__types--wrapper ${types[0].type.name}">
                <img class="pokemon__types--type" src="./media/icons/types/${types[0].type.name}.svg" />
            </div>
            `)
    } else {
        htmlString = ""
        types.forEach(type => {
            htmlString += (`
            <div class="pokemon__types--wrapper ${type.type.name}">
                <img class="pokemon__types--type" src="./media/icons/types/${type.type.name}.svg" />
            </div>
            `)
        });
        return htmlString
    }
}

function typesToString(types) {
    let typeString = ""
    for (i in types) {
        if (i == (types.length - 1)) {
            typeString += types[i].type.name
        } else {
            typeString += types[i].type.name + ", "
        }
    }
    return typeString
}


// Main

async function renderOnLoad() {
    const data = await searchAll(_pokemonLimit.value, _pokemonOffset.value);
    gallery.render(data)
};

let searching = false;
renderOnLoad();