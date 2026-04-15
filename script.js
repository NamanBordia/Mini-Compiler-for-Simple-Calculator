document.addEventListener('DOMContentLoaded', () => {

    /* --- Intersection Observer for Scroll Animations --- */
    const observeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    observeElements.forEach(el => observer.observe(el));

    /* --- Data for the Expression --- */
    const expression = "result = (a + b) * (c - d) / e";
    const tokens = [
        { val: "result", type: "Identifier (ID)", len: 6 },
        { val: "=", type: "Assignment", len: 1 },
        { val: "(", type: "Left Paren", len: 1 },
        { val: "a", type: "Identifier (ID)", len: 1 },
        { val: "+", type: "Plus Operator", len: 1 },
        { val: "b", type: "Identifier (ID)", len: 1 },
        { val: ")", type: "Right Paren", len: 1 },
        { val: "*", type: "Multiply Operator", len: 1 },
        { val: "(", type: "Left Paren", len: 1 },
        { val: "c", type: "Identifier (ID)", len: 1 },
        { val: "-", type: "Minus Operator", len: 1 },
        { val: "d", type: "Identifier (ID)", len: 1 },
        { val: ")", type: "Right Paren", len: 1 },
        { val: "/", type: "Divide Operator", len: 1 },
        { val: "e", type: "Identifier (ID)", len: 1 }
    ];

    /* --- Phase 2: Lexical Analysis Logic --- */
    const lexTarget = document.getElementById('lex-expression');
    const tokenBody = document.getElementById('tokens-body');
    const scanBtn = document.getElementById('scan-btn');
    const scanAllBtn = document.getElementById('scan-all-btn');

    // Prepare expression display
    lexTarget.innerHTML = '';
    let globalCharIndex = 0;
    
    // Create span for each char to highlight
    for (let c of expression) {
        let span = document.createElement('span');
        span.textContent = c;
        span.className = 'char-span';
        lexTarget.appendChild(span);
    }
    const charSpans = document.querySelectorAll('.char-span');

    let currentTokenIndex = 0;

    function buildRow(token) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${token.val}</td><td>${token.type}</td>`;
        tr.style.opacity = 0;
        tr.style.transform = 'translateY(-10px)';
        tr.style.transition = 'all 0.3s ease';
        tokenBody.appendChild(tr);
        setTimeout(() => {
            tr.style.opacity = 1;
            tr.style.transform = 'translateY(0)';
            tr.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);
    }

    function scanNext() {
        if (currentTokenIndex >= tokens.length) {
            scanBtn.disabled = true;
            scanBtn.textContent = "Scanning Complete";
            scanAllBtn.disabled = true;
            return;
        }

        const t = tokens[currentTokenIndex];
        
        // Find chars in expression
        let charsToHighlight = [];
        let stringToMatch = t.val;
        let matchedIndex = 0;
        
        // Remove previous active state, make them scanned
        charSpans.forEach(span => span.classList.remove('active'));
        
        // Find the actual characters, ignoring spaces
        while(globalCharIndex < charSpans.length && matchedIndex < stringToMatch.length) {
            let span = charSpans[globalCharIndex];
            if (span.textContent !== ' ') {
                charsToHighlight.push(span);
                matchedIndex++;
            } else {
                span.classList.add('scanned'); // space
            }
            globalCharIndex++;
        }

        charsToHighlight.forEach(span => {
            span.classList.add('active');
            setTimeout(() => span.classList.add('scanned'), 800);
        });

        buildRow(t);
        currentTokenIndex++;

        if (currentTokenIndex >= tokens.length) {
            scanBtn.disabled = true;
            scanBtn.textContent = "Scanning Complete";
            scanAllBtn.disabled = true;
        }
    }

    scanBtn.addEventListener('click', scanNext);
    scanAllBtn.addEventListener('click', () => {
        let interval = setInterval(() => {
            if (currentTokenIndex >= tokens.length) clearInterval(interval);
            else scanNext();
        }, 200);
    });

    /* --- Phase 3: Parsing (Interactive AST) --- */
    // Node generation sequence based heavily on Post-Order logical creation for an AST visually, 
    // but in reality compilers build bottom up. For visuals, we usually want Top-Down structure reveal.
    // Let's reveal top down
    
    const buildAstBtn = document.getElementById('build-ast-btn');
    const astStatusText = document.getElementById('ast-status-text');
    
    // Order of nodes to reveal for a bottom-up post-order effect
    const astRevealSteps = [
        { target: 5, text: "Terminal detected: 'a' (from the innermost parenthesis a + b)" },
        { target: 6, text: "Terminal detected: 'b' (from a + b)" },
        { target: 4, text: "Subtree evaluated: '+' operator joins 'a' and 'b'" },
        
        { target: 8, text: "Terminal detected: 'c' (from c - d)" },
        { target: 9, text: "Terminal detected: 'd' (from c - d)" },
        { target: 7, text: "Subtree evaluated: '-' operator joins 'c' and 'd'" },
        
        { target: 3, text: "Higher-level combination: '*' multiplies the two group results" },
        
        { target: 10, text: "Terminal detected: 'e'" },
        { target: 2, text: "Division follows: '/' divides the multiplication result by 'e'" },
        
        { target: 1, text: "Identifier identified for assignment: 'result'" },
        { target: 0, text: "Final binding: Root Assignment '=' links 'result' to the entire evaluated right-hand side" },
    ];

    let currentAstStep = 0;

    // Helper: make a node and its parents active
    function activateNode(nodeIndex) {
        const node = document.querySelector(`.node[data-target="${nodeIndex}"]`);
        if (!node) return;
        node.classList.add('active-build');
        
        // Find the parent UL and LI to make lines visible
        const parentLi = node.closest('li');
        if (parentLi) {
            parentLi.classList.add('active-build');
            const parentUl = parentLi.closest('ul');
            if (parentUl) {
                parentUl.classList.add('active-build');
            }
        }
    }

    // Force ul root to be visible.
    const rootUl = document.getElementById('ast-root');
    rootUl.classList.add('active-build');

    buildAstBtn.addEventListener('click', () => {
        if (currentAstStep >= astRevealSteps.length) return;
        
        const step = astRevealSteps[currentAstStep];
        activateNode(step.target);
        astStatusText.textContent = step.text;
        
        currentAstStep++;
        
        if (currentAstStep >= astRevealSteps.length) {
            buildAstBtn.disabled = true;
            buildAstBtn.textContent = "Tree Complete";
            astStatusText.textContent = "AST perfectly encodes the precedence!";
        }
    });

    /* --- Phase 4: TAC Generation (Post-Order Traversal) --- */
    const genTacBtn = document.getElementById('gen-tac-btn');
    const tacOutput = document.getElementById('tac-output');
    const tacExplainer = document.getElementById('tac-explainer');
    const quadBody = document.getElementById('quad-body');
    
    // Post-order traversal steps
    const postOrderSteps = [
        {
            nodes: [4, 5, 6], // +, a, b
            tac: "t1 = a + b",
            quad: ["+", "a", "b", "t1"],
            text: "Step 1: Visit '+' node. Children are evaluated."
        },
        {
            nodes: [7, 8, 9], // -, c, d
            tac: "t2 = c - d",
            quad: ["-", "c", "d", "t2"],
            text: "Step 2: Visit '-' node. Children are evaluated."
        },
        {
            nodes: [3], // * (t1, t2)
            tac: "t3 = t1 * t2",
            quad: ["*", "t1", "t2", "t3"],
            text: "Step 3: Visit '*' node. Combine intermediate results."
        },
        {
            nodes: [2, 10], // / (t3, e)
            tac: "t4 = t3 / e",
            quad: ["/", "t3", "e", "t4"],
            text: "Step 4: Visit '/' node. Divide by e."
        },
        {
            nodes: [0, 1], // =, result (t4)
            tac: "result = t4",
            quad: ["=", "t4", "—", "result"],
            text: "Step 5: Visit root '='. Assign final value."
        }
    ];

    let currentTacStep = 0;

    function buildQuadRow(quadArray) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${quadArray[0]}</td><td>${quadArray[1]}</td><td>${quadArray[2]}</td><td>${quadArray[3]}</td>`;
        tr.style.opacity = 0;
        tr.style.transform = 'translateY(-10px)';
        tr.style.transition = 'all 0.3s ease';
        quadBody.appendChild(tr);
        setTimeout(() => {
            tr.style.opacity = 1;
            tr.style.transform = 'translateY(0)';
        }, 50);
    }

    genTacBtn.addEventListener('click', () => {
        // Remove highlight from previous
        document.querySelectorAll('.highlight-post').forEach(n => n.classList.remove('highlight-post'));
        document.querySelectorAll('.new-tac-line').forEach(n => n.classList.remove('new-tac-line'));

        if (currentTacStep >= postOrderSteps.length) return;

        // Auto-build tree if not already done by user so highlight works!
        while (currentAstStep < astRevealSteps.length) {
            activateNode(astRevealSteps[currentAstStep].target);
            currentAstStep++;
        }
        if (buildAstBtn) { buildAstBtn.disabled = true; buildAstBtn.textContent = "Tree Complete by TAC"; }

        const step = postOrderSteps[currentTacStep];
        
        // Highlight nodes in the AST visual above!
        step.nodes.forEach(ni => {
            const node = document.querySelector(`.node[data-target="${ni}"]`);
            if (node) node.classList.add('highlight-post');
        });

        // Add TAC line
        const div = document.createElement('div');
        div.className = 'tac-line new-tac-line';
        div.innerHTML = `<span class="text-dim">${currentTacStep + 1}.</span> ${step.tac}`;
        tacOutput.appendChild(div);

        // Add Quad line
        buildQuadRow(step.quad);

        // Update explainer
        tacExplainer.textContent = step.text;

        currentTacStep++;

        if (currentTacStep >= postOrderSteps.length) {
            genTacBtn.disabled = true;
            genTacBtn.textContent = "Traversal Complete";
            tacExplainer.textContent = "End of intermediate generation! Five clean instructions produced.";
        }
    });

});
