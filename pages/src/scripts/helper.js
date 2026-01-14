// contains helper functions used across all pages
function openLogs() {
    window.jm.fetchLogs().then(data=> {
        logs = "";
        data.reverse().forEach(d => {logs += `${d}<br><br>`});
        openAlert("JMovie Logs", logs);
    }).catch(err => {
        openAlert("JMovie Logs",
            "Error opening logs: " + err
        );
    })
}

function openAlert(messageTitle, messageBody) {
    const jmAlert = document.getElementById("jMovieAlert");
    // bring into view
    jmAlert.classList.add("active");
    document.getElementById("messageTitle").innerHTML = messageTitle;
    document.getElementById("messageBody").innerHTML = messageBody;
}

function closeAlert() {
    document.getElementById("jMovieAlert").classList.remove("active");
}

function fadeLoader(time) {
    setTimeout(() => {
        document.getElementById("whiteoutContainer").classList.add("hidden");
    }, time);
}

function generateSearchPlaceholder() {
    titles = [
        "The Gentlemen",
        "Oppenheimer",
        "Project X",
        "Deadpool & Wolverine",
        "The Wolf of Wall Street",
        "Smiling Friends",
        "21 Jump Street",
        "Interstellar",
        "Joker",
        "Rick and Morty",
        "Breaking Bad",
        "Dexter",
        "Grey's Anatomy",
        "Stranger Things",
        "Family Guy"
    ];

    document.getElementById("searchBar").placeholder = titles[Math.floor(Math.random() * titles.length)];
}

function focusSearchBar() {
    document.getElementById("searchBar").focus();
    document.getElementById("searchBar").select();
}

// helper function for better search result 
function levenshtein(a, b) {
    let matrix = [];
    if (a.length == 0) return b.length;

    if (b.length == 0) return a.length;

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) == a.charAt(j-1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                                        Math.min(matrix[i][j - 1] + 1, // insertion
                                        matrix[i - 1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
}

// prevent unsafe closure Ctrl+Shift+W works properly from my testing
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'w')
    event.preventDefault(); 
  if (event.altKey && event.code === 'F4')
    event.preventDefault();
});