//DATA CONTROLLER
let dataController = (function() {
    
    //typo object
    const spell = new Typo("en_US", false, false, { dictionaryPath: "typo/dictionaries" });    

    //function for checking if each permutation is a word
    let isWord = function(word) {
        return spell.check(word);
    }

    //Dictionary API
    let dictionary = {

        makeRequest: function(word) {

            let request = new XMLHttpRequest();
            let data;

            request.open('GET', 'https://owlbot.info/api/v1/dictionary/' + word, false);

            request.setRequestHeader('content-type', 'application/json');
            
            return request.onload = function() {
                if(request.status >= 200 && request.status < 400) {
                    //success!
                    data = JSON.parse(request.responseText);
                    console.log(data);
                    return data;
                } else {
                    console.log('Server returned an error: ' + request.status);
                }
            }

            return request.onerror = function() {
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

    //function which creates all permutations
    let permutator = function(input) {
        let permArr = [],
        usedChars = [],
        origLength = input.length,
        count = 0;
        
        return (function main() {

            for (let i = 0; i < input.length; i++) {

                    //picked this from the internet, might not be best
                    let ch = input.splice(i, 1)[0];
                    usedChars.push(ch);
                    if (input.length === 0) {
                        permArr.push(usedChars.slice());
                    }
                    main();
                    input.splice(i, 0, ch);
                    usedChars.pop();
            }
            return permArr; //array of all permutations
        })();
    }

    let findWords = function(inputArr) {

        //object constructor for words and their definitions
        function DefinedWord(word, definition) {
            this.word = word;
            this.definition = definition;
        }

        //call function to get array of permutations
        let permutations = permutator(inputArr),
        definedWords = [],
        words = [],
        foundCount = 0,
        dec = permutations[0].length;

        while(dec > 3) {
            //cylcle through permutations and check for words 
            permutations.forEach(permutation => {
                let word = permutation.slice(0, dec).join('');

                //first check it is in root dictionary and unique
                if(isWord(word) && words.indexOf(word) === -1) {
                    words.push(word);

                    //check dictionary API
                    let wordData = dictionary.getDef(word);
                    console.log(wordData);
                    /*
                        //add new word/definition object to array
                        definedWords.push(new DefinedWord(word, def));
                        foundCount++;
                        if(foundCount === 5) {
                            return definedWords;
                        }
                    }*/
                }
            });

            dec--;
        }

        return definedWords;
    }

    //PUBLIC FUNCTIONS
    return {

        //start word gathering process
        getWords(input) {
            let splitInput = input.split('');
            return findWords(splitInput);
        },

        getDictionary: function(word) {
            dictionary.makeRequest(word);
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
        progressBar: document.querySelector('progress')
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
                html ='<table><tr><th>Word</th><th>Definition</th></tr>';
                wordsPlusDefs.forEach(wordDef => {
                    html += `<tr><td>${wordDef.word}</td><td>${wordDef.definition}</td></tr>`;
                })
                html +='</table>';
            } else {
                html = '<p>No words found this time <img src="img/unhappy.png" height="20"</p>'
            }
            elements.loading.style.display = 'none';
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
    }

})();

//GLOBAL CONTROLLER
let controller = (function(data, ui) {


    let setUpEventListeners = function() {

        //get DOM variables
        const DOM = ui.getDOM();

        //event listeners
        DOM.submit.addEventListener('click', submission);

        document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13) {
                submission();
            }
        });
    }

    //function called when submit button pressed
    let submission = function() {
        let wordsToDisplay;

        //get letters from UI
        let submission = ui.getSubmission();

        //show loading screen
        ui.loadingScreen(submission);

        //function delayed to allow loading screen time to display
        setTimeout(function() {

            //call permutation functions
            wordsToDisplay = data.getWords(submission); 

            //display results
            ui.display(wordsToDisplay);
        }, 500);

    }

    return {

        init: function() {
            setUpEventListeners();
            ui.resetScreen();
        }
    }

    

})(dataController, uiController);

controller.init();