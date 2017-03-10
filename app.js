//DATA CONTROLLER
let dataController = (function() {

    //array of combinations
    let combinations = [];

    //word table 
    let wordTable = [];

    //sum table 
    let sumTable = [];

    //typo object
    const spell = new Typo("en_US", false, false, { dictionaryPath: "typo/dictionaries" });    

    //Dictionary API
    let dictionary = {

        makeRequest: function(word) {

            let request = new XMLHttpRequest();
            let data;

            request.open('GET', 'https://owlbot.info/api/v1/dictionary/' + word, true);
            
            request.onload = function() {
                if(request.status >= 200 && request.status < 400) {

                    //success!
                    data = JSON.parse(request.responseText);
                    handler(true, word, data);

                } else {

                    //fail
                    console.log('Server returned an error: ' + request.status);
                    handler(false);
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

    //function which creates all combinations
    function combinate(input) {

        usedChars = [],
        origLength = input.length,
        count = 0;
        
        return (function main() {

            for (let i = 0; i < input.length; i++) {

                    //picked this from the internet, might not be best
                    let ch = input.splice(i, 1)[0];
                    usedChars.push(ch);
                    if (input.length === 0) {
                        combinations.push(usedChars.slice());
                    }
                    main();
                    input.splice(i, 0, ch);
                    usedChars.pop();
            }
        })();
    }

    //PUBLIC FUNCTIONS
    return {

        makecombinations: function(array) {
            combinations = [];
            combinate(array);
        },

        getcombinations: function() {
            return combinations;
        },

        //function for checking if each combination is a word
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
        wordInput: document.querySelector('#inputLetters'),
        output: document.querySelector('#resultDiv'),
        wordSubmit: document.querySelector('#submitLetters'),
        loading: document.querySelector('#loading'),
        loadingSpan: document.querySelector('#wordsToFind'),
        progressBar: document.querySelector('progress'),
        definitions: document.querySelector('#definitions'),
        defsTitle: document.querySelector('#defs_word'),
        defs: document.querySelector('#defs'),
        defClose: document.querySelector('#closeDiv')
    };

    function makeNice(word) {
        word = word.split('');
        word[0] = word[0].toUpperCase();
        return word.join('');
    }

    //PUBLIC FUNCTIONS
    return {

        //get DOM variables from UI Controller
        getDOM: function() {
            return elements;
        },

        //get letters from the input box
        getSubmission: function(game) {
            let input = elements[game + 'Input'].value;
            elements[game + 'Input'].value = '';
            return input;    
        },

        notEnoughLetters: function() {
            alert('Please enter between 4 and 9 letters');
        },

        //display word results in a table
        displayWords: function(wordsPlusDefs) {
            let html;
            if(wordsPlusDefs.length > 0) {
                html ='<table>';
                wordsPlusDefs.forEach(wordDef => {
                    html += `<tr><td>${makeNice(wordDef.name)}</td><td><button class="showDef" value="${wordDef.name}">Show Definition</button></td></tr>`;
                })
                html +='</table>';
            } else {
                html = '<p>No words found this time <img src="img/unhappy.png" height="20"</p>'
            }
            elements.loading.style.display = 'none';
            elements.progressBar.value = 0;
            elements.output.innerHTML = html;
            elements.wordInput.focus();
        },

        //clear screen to starting display
        resetScreen: function(game) {
            elements.output.innerHTML = '';
            elements.wordInput.focus();
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

            elements.defsTitle.textContent = makeNice(data.name);

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
        DOM.wordSubmit.addEventListener('click', function() {
            submission('word');
        });

       /* document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13) {
                if(DOM.wordInput.hasFocus()) {
                    sumbmission('word');
                } else if(DOM.numberInput.hasFocus()) {
                    submission('number');
                }
            }
        }); */

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

        //display
        ui.displayDefinitions(row);

    }

    function findWords() {

        let foundCount = 0,
        foundWords = [];
        dec = data.getcombinations()[0].length;

        data.resetWordTable();

        while(dec > 3) {
            //cylcle through combinations and check for words 
            data.getcombinations().forEach(combination => {
                let word = combination.slice(0, dec).join('');

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
    let submission = function(game) {

        //get letters from UI
        let submission = ui.getSubmission(game).toLowerCase();

        if(game === 'word') {
            if(submission.length < 4) {
                ui.notEnoughLetters();
            } else {

               //show loading screen
                ui.loadingScreen(submission);

                ui.incProgBar();

                //function delayed to allow loading screen time to display
                setTimeout(function() {

                    //call combination function
                    data.makecombinations(submission.split(''));
                    ui.incProgBar();

                    setTimeout(function() {
                        //cycle through combinations to find words
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
                                ui.displayWords(data.getWords());
                            }, 100);
                        }, 100);
                        
                    }, 100);
                }, 100); 
            }
        } else {
            // run code for numbers game
        }
    }

    
    

    return {

        init: function() {
            setUpEventListeners();
            ui.resetScreen();
        },

        numberTest: function(target) {
            data.makecombinations([100, 75, 50, 3, 5, 8]);

            let numbs = data.getcombinations(),
            found;

            while(!found) {
                numbs.forEach(numbSet => {
                    let sum = `${numbSet[0]} ${rand()} ${numbSet[1]} ${rand()} ${numbSet[2]} ${rand()} ${numbSet[3]} ${rand()} ${numbSet[4]} ${rand()} ${numbSet[5]}`;

                    for(let i = 3; i < 12; i += 2) {
                        let sumToTest = sum.split(' ').slice(0, i).join(' ');
                        if(eval(sumToTest) === target) {
                            console.log(sumToTest + ' = ' + eval(sumToTest));
                            found = true;
                        };
                    }
                });
            }

            function rand() {
                let ops = ['+', '-', '*', '/'];

                let r = Math.round(Math.random() * 3);

                return ops[r];
            }
        }
    }

    

})(dataController, uiController);

controller.init();
//controller.numberTest();