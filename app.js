//DATA CONTROLLER
let dataController = (function() {

    //array of permutations
    let permutations = [];

    //word table 
    let wordTable = [];

    //typo object
    const spell = new Typo("en_US", false, false, { dictionaryPath: "typo/dictionaries" });    

    //Dictionary API
    let dictionary = {

        makeRequest: function(word) {

            let request = new XMLHttpRequest();
            let data;

            request.open('GET', 'https://owlbot.info/api/v1/dictionary/' + word, true);

            //request.setRequestHeader('content-type', 'application/json');
            
            request.onload = function() {
                if(request.status >= 200 && request.status < 400) {

                    //success!
                    data = JSON.parse(request.responseText);
                    handler(true, word, data);

                } else {

                    //fail
                    console.log('Server returned an error: ' + request.status);
                    handler(false)
                }
            }

            request.onerror = function() {
                console.log('There was an error connecting to the server');
            }

            request.send();
        },

        //returns definition for word
        getDef: function(word) {
            let def = dictionary.makeRequest(word);
            return def;
        }

    }

     //ajax handler
    function handler(success, word, data) {
        if(success) {
            wordTable.forEach(obj => {
                if(obj.name === word) {
                    data.forEach(el => {
                        obj.types.push(el.type);
                        obj.definitions.push(el.defenition);
                    });
                }
            });

        } else {
            console.log('no definition');
        }
    }

    //function which creates all permutations
    function permutate(input) {

        usedChars = [],
        origLength = input.length,
        count = 0;
        
        return (function main() {

            for (let i = 0; i < input.length; i++) {

                    //picked this from the internet, might not be best
                    let ch = input.splice(i, 1)[0];
                    usedChars.push(ch);
                    if (input.length === 0) {
                        permutations.push(usedChars.slice());
                    }
                    main();
                    input.splice(i, 0, ch);
                    usedChars.pop();
            }
        })();
    }

    //PUBLIC FUNCTIONS
    return {

        makePermutations: function(array) {
            permutations = [];
            permutate(array);
        },

        getPermutations: function() {
            return permutations;
        },

        //function for checking if each permutation is a word
        isWord: function(word) {
            return spell.check(word);
        },

        resetWordTable: function() {
            wordTable = [];
        },

        addWord: function(word) {
            wordTable.push({name: word, types: [], definitions: []});
        },

        //temporary dev function
        getWords: function() {
            return wordTable;
        },

        searchDictionary: function(word) {
            dictionary.makeRequest(word);
        },

        getWordRow: function(word) {
            return wordTable.find(obj => obj.name === word);
        }

    }

})();

//UI CONTROLLER
let uiController = (function() {

    //assignation of DOM elements to variable names
    const elements = {
        input: document.querySelector('#inputLetters'),
        output: document.querySelector('#resultDiv'),
        submit: document.querySelector('#submitButton'),
        loading: document.querySelector('#loading'),
        loadingSpan: document.querySelector('#wordsToFind'),
        progressBar: document.querySelector('progress'),
        definitions: document.querySelector('#definitions'),
        defsTitle: document.querySelector('#defs_word'),
        defs: document.querySelector('#defs'),
        defClose: document.querySelector('#closeDiv')
    };

    //PUBLIC FUNCTIONS
    return {

        //get DOM variables from UI Controller
        getDOM: function() {
            return elements;
        },

        //get letters from the input box
        getSubmission: function() {
            let input = elements.input.value;
            elements.input.value = '';
            return input;
        },

        //display results in a table
        display: function(wordsPlusDefs) {
            let html;
            if(wordsPlusDefs.length > 0) {
                html ='<table>';
                wordsPlusDefs.forEach(wordDef => {
                    html += `<tr><td>${wordDef.name}</td><td><button class="showDef" value="${wordDef.name}">Show Definition</button></td></tr>`;
                })
                html +='</table>';
            } else {
                html = '<p>No words found this time <img src="img/unhappy.png" height="20"</p>'
            }
            elements.loading.style.display = 'none';
            elements.progressBar.value = 0;
            elements.output.innerHTML = html;
            elements.input.focus();
        },

        //clear screen to starting display
        resetScreen: function() {
            elements.output.innerHTML = '';
            elements.input.focus();
            elements.progressBar.value = 0;
        },

        //loading screen to be displayed whilst function runs
        loadingScreen: function(letters) {
            this.resetScreen();
            elements.loadingSpan.innerHTML = letters;
            elements.loading.style.display = 'block';
        },

        incProgBar: function() {
            elements.progressBar.value += 1;
        },

        displayDefinitions: function(data) {

            let textBody = '';

            elements.defsTitle.textContent = data.name;

            if(data.definitions.length > 0) {
                data.definitions.forEach((def, i) => {
                    textBody += `<br /><p class="defParas"><strong>${data.types[i]}</strong>  - ${def}</p><br /><hr />`;
                });
            } else {
                textBody = '<br /><p>No definition found for this word.</p>'
            }

            elements.defs.innerHTML = textBody;

            //show div
            elements.definitions.style.display = 'block';
        }
    }

})();

//GLOBAL CONTROLLER
let controller = (function(data, ui) {


    function setUpEventListeners() {

        //get DOM variables
        const DOM = ui.getDOM();

        //event listeners
        DOM.submit.addEventListener('click', submission);

        document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13) {
                submission();
            }
        });

        DOM.output.addEventListener('click', function(e) {
            if(e.target.className === 'showDef') {
                showDefinitions(e.target.value);
            }
        });

        DOM.defClose.addEventListener('click', function() {
            DOM.definitions.style.display = 'none';
        })
    }

    function showDefinitions(buttonValue) {

        //look up word in table
        let row = data.getWordRow(buttonValue);

        console.log(row);

        //display
        ui.displayDefinitions(row);

    }

    function findWords() {

        let foundCount = 0,
        foundWords = [];
        dec = data.getPermutations()[0].length;

        data.resetWordTable();

        while(dec > 3) {
            //cylcle through permutations and check for words 
            data.getPermutations().forEach(permutation => {
                let word = permutation.slice(0, dec).join('');

                //check it is in root dictionary and unique
                if(data.isWord(word) && foundWords.indexOf(word) === -1) {
                    foundWords.push(word);
                    data.addWord(word);
                }
            });
            dec--;
        }
    }

    //function called when submit button pressed
    let submission = function() {

        //get letters from UI
        let submission = ui.getSubmission();

        //show loading screen
        ui.loadingScreen(submission);

        ui.incProgBar();

        //function delayed to allow loading screen time to display
        setTimeout(function() {

            //call permutation function
            data.makePermutations(submission.split('')),
            ui.incProgBar();

            setTimeout(function() {
                //cycle through permutations to find words
                findWords();
                ui.incProgBar();
                setTimeout(function() {
                    //cycle through word table and add definitions
                    data.getWords().forEach(word => {
                        data.searchDictionary(word.name);
                    });
                    ui.incProgBar();
                    setTimeout(function() {
                        //display results
                        ui.display(data.getWords());
                    }, 100);
                }, 100);
                
            }, 100);
        }, 100);

    }

    
    

    return {

        init: function() {
            setUpEventListeners();
            ui.resetScreen();
        }
    }

    

})(dataController, uiController);

controller.init();