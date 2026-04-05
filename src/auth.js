import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase Configuration
const supabaseUrl = 'https://zxwhjermpiyofdqubblq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4d2hqZXJtcGl5b2ZkcXViYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTE5NjQsImV4cCI6MjA5MDQ2Nzk2NH0.vI2Q351FjRDFYe4aMUMyg_vy-bXG1EL6ZohZlwhnxzs';
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const toggleBtn = document.getElementById('toggle-password');
const iconShow = document.getElementById('icon-show');
const iconHide = document.getElementById('icon-hide');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const cup = document.getElementById('cup');
const confetti = document.getElementById('confetti');
const ladderGroup = document.getElementById('ladder-group');

const ikClimberGroup = document.getElementById('ik-climber');
const ragdollGroup = document.getElementById('ragdoll');
const ikHead = document.getElementById('ik-head');
const ikTorso = document.getElementById('ik-torso');
const ikLArm = document.getElementById('ik-left-arm');
const ikRArm = document.getElementById('ik-right-arm');
const ikLLeg = document.getElementById('ik-left-leg');
const ikRLeg = document.getElementById('ik-right-leg');

gsap.config({ force3D: true });
gsap.set(cup, { transformOrigin: "50% 100%" });

// ----------------------------------------------------------------------
// Physics Engine & Ladder Generation
// ----------------------------------------------------------------------
const { Engine, Render, Runner, Bodies, Body, Composite, Constraint, Events } = Matter;

const engine = Engine.create();
engine.world.gravity.y = 1;

const ladderStartX = 100, ladderStartY = 310;
const ladderEndX = 175, ladderEndY = 60;
const rungsCount = 10;
const rungs = [];

// Create static physics bounds
Composite.add(engine.world, [
    Bodies.rectangle(200, 360, 400, 20, { isStatic: true, label: "floor" }),
    Bodies.rectangle(-20, 175, 40, 350, { isStatic: true }),
    Bodies.rectangle(420, 175, 40, 350, { isStatic: true })
]);

// Build physical & visual ladder
const dx = ladderEndX - ladderStartX;
const dy = ladderEndY - ladderStartY;
const ladderLen = Math.hypot(dx, dy);
const ladderAngle = Math.atan2(dy, dx);
const perpX = Math.cos(ladderAngle + Math.PI/2);
const perpY = Math.sin(ladderAngle + Math.PI/2);
const railSpread = 20;

const drawLine = (x1, y1, x2, y2) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
    ladderGroup.appendChild(el);
};

drawLine(ladderStartX - railSpread, ladderStartY, ladderEndX - railSpread, ladderEndY);
drawLine(ladderStartX + railSpread, ladderStartY, ladderEndX + railSpread, ladderEndY);

// Physics rails
const cx1 = ladderStartX + dx/2 - perpX*railSpread, cy1 = ladderStartY + dy/2 - perpY*railSpread;
const cx2 = ladderStartX + dx/2 + perpX*railSpread, cy2 = ladderStartY + dy/2 + perpY*railSpread;
Composite.add(engine.world, [
    Bodies.rectangle(cx1, cy1, ladderLen, 6, { isStatic: true, angle: ladderAngle }),
    Bodies.rectangle(cx2, cy2, ladderLen, 6, { isStatic: true, angle: ladderAngle })
]);

for (let i = 0; i <= rungsCount; i++) {
    const t = i / rungsCount;
    const x = ladderStartX + dx * t;
    const y = ladderStartY + dy * t;
    rungs.push({ x, y });
    drawLine(x - railSpread, y, x + railSpread, y);
    Composite.add(engine.world, Bodies.rectangle(x, y, railSpread*2, 4, { isStatic: true, angle: ladderAngle }));
}

// ----------------------------------------------------------------------
// Inverse Kinematics (IK) Setup
// ----------------------------------------------------------------------
let ikActive = true;
let climbProgress = 0; // 0 to 1

const armL1 = 12; // Upper arm length
const armL2 = 12; // Lower arm length
const legL1 = 18; // Upper leg length
const legL2 = 18; // Lower leg length

let climberState = {
    rx: ladderStartX - 15, ry: ladderStartY + 10,
    torsoAngle: -0.2, // leaning into ladder
    lAx: ladderStartX - railSpread, lAy: ladderStartY - 30,
    rAx: ladderStartX + railSpread, rAy: ladderStartY - 40,
    lLx: ladderStartX - railSpread, lLy: ladderStartY + 40,
    rLx: ladderStartX + railSpread, rLy: ladderStartY + 30,
    jumpScale: 1
};

function solveIK(root, target, l1, l2, flip) {
    const tx = target.x - root.x;
    const ty = target.y - root.y;
    const dist = Math.sqrt(tx*tx + ty*ty);

    if (dist >= l1 + l2 - 0.01) {
        const angle = Math.atan2(ty, tx);
        return { x: root.x + Math.cos(angle)*l1, y: root.y + Math.sin(angle)*l1 };
    }

    const d = Math.max(dist, Math.abs(l1 - l2) + 0.01);
    const a = (l1*l1 + d*d - l2*l2) / (2 * d * l1);
    const aAngle = Math.acos(Math.max(-1, Math.min(1, a)));
    
    const targetAngle = Math.atan2(ty, tx);
    const finalAngle = flip ? targetAngle - aAngle : targetAngle + aAngle;
    
    return { x: root.x + Math.cos(finalAngle)*l1, y: root.y + Math.sin(finalAngle)*l1 };
}

function updateSVGPath(pathElement, root, joint, target) {
    pathElement.setAttribute('d', `M ${root.x} ${root.y} L ${joint.x} ${joint.y} L ${target.x} ${target.y}`);
}

gsap.ticker.add(() => {
    if (!ikActive) return;

    // Apply root scaling for jumps
    const rootX = climberState.rx;
    const rootY = climberState.ry;
    
    // Calculate skeletal points
    const shoulders = { 
        x: rootX + Math.sin(climberState.torsoAngle)*25, 
        y: rootY - Math.cos(climberState.torsoAngle)*25 
    };
    const headPoint = { 
        x: shoulders.x + Math.sin(climberState.torsoAngle)*12, 
        y: shoulders.y - Math.cos(climberState.torsoAngle)*12 
    };

    // Torso
    ikTorso.setAttribute('x1', rootX); ikTorso.setAttribute('y1', rootY);
    ikTorso.setAttribute('x2', shoulders.x); ikTorso.setAttribute('y2', shoulders.y);

    // Head
    ikHead.setAttribute('cx', headPoint.x);    ikHead.setAttribute('cy', headPoint.y);

    // Limbs IK
    const lATarget = {x: climberState.lAx, y: climberState.lAy};
    const rATarget = {x: climberState.rAx, y: climberState.rAy};
    const lLTarget = {x: climberState.lLx, y: climberState.lLy};
    const rLTarget = {x: climberState.rLx, y: climberState.rLy};

    const lArmJoint = solveIK(shoulders, lATarget, armL1, armL2, true);
    const rArmJoint = solveIK(shoulders, rATarget, armL1, armL2, false);
    const lLegJoint = solveIK({x: rootX, y: rootY}, lLTarget, legL1, legL2, false);
    const rLegJoint = solveIK({x: rootX, y: rootY}, rLTarget, legL1, legL2, true);

    updateSVGPath(ikLArm, shoulders, lArmJoint, lATarget);
    updateSVGPath(ikRArm, shoulders, rArmJoint, rATarget);
    updateSVGPath(ikLLeg, {x: rootX, y: rootY}, lLegJoint, lLTarget);
    updateSVGPath(ikRLeg, {x: rootX, y: rootY}, rLegJoint, rLTarget);
});

// Interactive Climbing Animation
let climbTween = null;

function calculateProgress() {
    const emailLen = Math.min(emailInput.value.length, 25);
    const passLen = Math.min(passwordInput.value.length, 20);
    return (emailLen / 25) * 0.50 + (passLen / 20) * 0.40;
}

function updateClimberPosition(targetProgress) {
    climbProgress = targetProgress;
    const t = climbProgress;
    
    // Evaluate ideal climber root position
    const targetRootX = ladderStartX + dx * t - 15;
    const targetRootY = ladderStartY + dy * t + 10;
    
    // Evaluate target rung for hands/feet based on progress
    const handRungIdx = Math.min(rungsCount, Math.floor(t * rungsCount + 3));
    const footRungIdx = Math.max(0, handRungIdx - 4);

    const hRung = rungs[handRungIdx] || rungs[rungsCount];
    const fRung = rungs[footRungIdx] || rungs[0];

    if(climbTween) climbTween.kill();
    
    climbTween = gsap.to(climberState, {
        duration: 0.6,
        ease: "power2.out",
        rx: targetRootX,
        ry: targetRootY,
        lAx: hRung.x - railSpread,
        lAy: hRung.y + 5,
        rAx: hRung.x + railSpread,
        rAy: hRung.y - 10,
        lLx: fRung.x - railSpread,
        lLy: fRung.y,
        rLx: fRung.x + railSpread,
        rLy: fRung.y - 10
    });
}

emailInput.addEventListener('input', () => updateClimberPosition(calculateProgress()));
passwordInput.addEventListener('input', () => updateClimberPosition(calculateProgress()));

// ----------------------------------------------------------------------
// Ragdoll Physics Setup
// ----------------------------------------------------------------------
let ragdollProps = { head: null, torso: null, auL: null, alL: null, auR: null, alR: null, luL: null, llL: null, luR: null, llR: null };
let constraints = [];

function createRagdoll(x, y) {
    const group = Body.nextGroup(true);
    const cb = { collisionFilter: { group } };

    ragdollProps.head = Bodies.circle(x, y - 40, 14, cb);
    ragdollProps.torso = Bodies.rectangle(x, y - 10, 10, 30, cb);
    
    ragdollProps.auL = Bodies.rectangle(x - 15, y - 25, 6, armL1, cb);
    ragdollProps.alL = Bodies.rectangle(x - 20, y - 10, 6, armL2, cb);
    
    ragdollProps.auR = Bodies.rectangle(x + 15, y - 25, 6, armL1, cb);
    ragdollProps.alR = Bodies.rectangle(x + 20, y - 10, 6, armL2, cb);
    
    ragdollProps.luL = Bodies.rectangle(x - 10, y + 15, 8, legL1, cb);
    ragdollProps.llL = Bodies.rectangle(x - 10, y + 35, 6, legL2, cb);
    
    ragdollProps.luR = Bodies.rectangle(x + 10, y + 15, 8, legL1, cb);
    ragdollProps.llR = Bodies.rectangle(x + 10, y + 35, 6, legL2, cb);

    const bodies = Object.values(ragdollProps);
    Composite.add(engine.world, bodies);

    // Neck
    constraints.push(Constraint.create({ bodyA: ragdollProps.torso, pointA: {x:0, y:-15}, bodyB: ragdollProps.head, pointB: {x:0, y:12}, stiffness: 0.9, length: 2 }));
    
    // Shoulders
    constraints.push(Constraint.create({ bodyA: ragdollProps.torso, pointA: {x:-5, y:-10}, bodyB: ragdollProps.auL, pointB: {x:0, y:-armL1/2}, stiffness: 0.9, length: 2 }));
    constraints.push(Constraint.create({ bodyA: ragdollProps.torso, pointA: {x:5, y:-10}, bodyB: ragdollProps.auR, pointB: {x:0, y:-armL1/2}, stiffness: 0.9, length: 2 }));
    
    // Elbows
    constraints.push(Constraint.create({ bodyA: ragdollProps.auL, pointA: {x:0, y:armL1/2}, bodyB: ragdollProps.alL, pointB: {x:0, y:-armL2/2}, stiffness: 0.9, length: 2 }));
    constraints.push(Constraint.create({ bodyA: ragdollProps.auR, pointA: {x:0, y:armL1/2}, bodyB: ragdollProps.alR, pointB: {x:0, y:-armL2/2}, stiffness: 0.9, length: 2 }));
    
    // Hips
    constraints.push(Constraint.create({ bodyA: ragdollProps.torso, pointA: {x:-5, y:15}, bodyB: ragdollProps.luL, pointB: {x:0, y:-legL1/2}, stiffness: 0.9, length: 2 }));
    constraints.push(Constraint.create({ bodyA: ragdollProps.torso, pointA: {x:5, y:15}, bodyB: ragdollProps.luR, pointB: {x:0, y:-legL1/2}, stiffness: 0.9, length: 2 }));
    
    // Knees
    constraints.push(Constraint.create({ bodyA: ragdollProps.luL, pointA: {x:0, y:legL1/2}, bodyB: ragdollProps.llL, pointB: {x:0, y:-legL2/2}, stiffness: 0.9, length: 2 }));
    constraints.push(Constraint.create({ bodyA: ragdollProps.luR, pointA: {x:0, y:legL1/2}, bodyB: ragdollProps.llR, pointB: {x:0, y:-legL2/2}, stiffness: 0.9, length: 2 }));

    Composite.add(engine.world, constraints);
}

function updateRagdollSVG() {
    if (ikActive) return;
    
    const setLine = (id, b1, b2, py1, py2) => {
        const el = document.getElementById(id);
        const p1 = Math.cos(b1.angle)*py1; const p2 = Math.sin(b1.angle)*py1;
        const p3 = Math.cos(b2.angle)*py2; const p4 = Math.sin(b2.angle)*py2;
        el.setAttribute('x1', b1.position.x - p2); el.setAttribute('y1', b1.position.y + p1);
        el.setAttribute('x2', b2.position.x - p4); el.setAttribute('y2', b2.position.y + p3);
    };

    const b = ragdollProps;
    document.getElementById('rb-head').setAttribute('cx', b.head.position.x);
    document.getElementById('rb-head').setAttribute('cy', b.head.position.y);
    
    setLine('rb-torso', b.torso, b.torso, -15, 15);
    setLine('rb-left-arm-upper', b.auL, b.auL, -armL1/2, armL1/2);
    setLine('rb-left-arm-lower', b.alL, b.alL, -armL2/2, armL2/2);
    setLine('rb-right-arm-upper', b.auR, b.auR, -armL1/2, armL1/2);
    setLine('rb-right-arm-lower', b.alR, b.alR, -armL2/2, armL2/2);
    setLine('rb-left-leg-upper', b.luL, b.luL, -legL1/2, legL1/2);
    setLine('rb-left-leg-lower', b.llL, b.llL, -legL2/2, legL2/2);
    setLine('rb-right-leg-upper', b.luR, b.luR, -legL1/2, legL1/2);
    setLine('rb-right-leg-lower', b.llR, b.llR, -legL2/2, legL2/2);
}

Events.on(engine, 'afterUpdate', updateRagdollSVG);
// Start runner for physics
const runner = Runner.create();
createRagdoll(0, 0); // initial off-screen create
Runner.start(runner, engine);

// Hide ragdoll initially
const bodiesToHide = Object.values(ragdollProps);
bodiesToHide.forEach(b => Body.setStatic(b, true));

function triggerFall() {
    ikActive = false;
    ikClimberGroup.classList.add('hidden');
    ragdollGroup.classList.remove('hidden');
    
    // Teleport ragdoll to IK location
    const rx = climberState.rx;
    const ry = climberState.ry;
    
    const deltaX = rx - ragdollProps.torso.position.x;
    const deltaY = ry - ragdollProps.torso.position.y;
    
    // Only translate the bodies belonging to the ragdoll, not the static world boundaries!
    bodiesToHide.forEach(b => {
        Body.translate(b, { x: deltaX, y: deltaY });
    });
    
    // Wake up bodies
    bodiesToHide.forEach(b => {
        Body.setStatic(b, false);
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
    });

    // Apply backward force
    Body.applyForce(ragdollProps.torso, ragdollProps.torso.position, { x: -0.015, y: -0.015 });
}

// ----------------------------------------------------------------------
// Interactions
// ----------------------------------------------------------------------
toggleBtn.addEventListener('mousedown', (e) => e.preventDefault());
let isPasswordVisible = false;
toggleBtn.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    if (isPasswordVisible) {
        passwordInput.type = "text";
        iconShow.classList.remove('hidden');
        iconHide.classList.add('hidden');
    } else {
        passwordInput.type = "password";
        iconShow.classList.add('hidden');
        iconHide.classList.remove('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    
    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value;

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Authenticating...";
    submitBtn.style.opacity = "0.7";
    submitBtn.style.pointerEvents = "none";

    const { data, error } = await supabase.auth.signInWithPassword({ email: emailVal, password: passVal });

    if (error) {
        loginError.innerText = error.message || "Invalid email or password. Please try again.";
        loginError.classList.remove('hidden');
        gsap.fromTo(loginForm, { x: -5 }, { x: 5, duration: 0.1, yoyo: true, repeat: 3, ease: "linear" });
        
        triggerFall();

        submitBtn.innerText = originalText;
        submitBtn.style.opacity = "1";
        submitBtn.style.pointerEvents = "auto";
        return;
    }

    // Success Jump
    if(climbTween) climbTween.kill();
    gsap.to(climberState, {
        duration: 0.8,
        ease: "back.out(1.5)",
        rx: 260,
        ry: 60,
        torsoAngle: 0,
        lAx: 275, lAy: 35,
        rAx: 295, rAy: 35,
        lLx: 255, lLy: 80,
        rLx: 265, rLy: 80,
    });
    
    gsap.to(cup, { y: -20, rotate: 10, scale: 1.2, duration: 0.3, ease: "back.out(2)", delay: 0.6 });
    
    gsap.to(confetti, { opacity: 1, duration: 0.1, delay: 0.6 });
    gsap.fromTo(confetti.children, { y: 0, scale: 0 }, { y: -30, scale: 1, stagger: 0.05, duration: 0.5, ease: "power2.out", delay: 0.6 });

    setTimeout(() => {
        window.location.href = import.meta.env.BASE_URL + 'dashboard.html';
        submitBtn.innerText = originalText;
        submitBtn.style.opacity = "1";
        submitBtn.style.pointerEvents = "auto";
    }, 1800);
});

// ----------------------------------------------------------------------
// Password Recovery Flow
// ----------------------------------------------------------------------
const forgotPwdLink = document.getElementById('forgot-pwd-link');
if (forgotPwdLink) {
    forgotPwdLink.addEventListener('click', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        
        const emailVal = emailInput.value.trim();
        if (!emailVal) {
            loginError.innerText = "Please enter your email above to reset your password.";
            loginError.classList.remove('hidden');
            loginError.classList.remove('text-emerald-500');
            loginError.classList.add('text-red-500');
            return;
        }

        const originalText = forgotPwdLink.innerText;
        forgotPwdLink.innerText = "Sending link...";
        forgotPwdLink.style.pointerEvents = "none";
        forgotPwdLink.style.opacity = "0.6";
        
        // We do not strictly need a full redirect URL in this exact test,
        // but adding it ensures the user comes back to our app.
        const { data, error } = await supabase.auth.resetPasswordForEmail(emailVal, {
            redirectTo: window.location.origin + import.meta.env.BASE_URL + 'index.html'
        });

        if (error) {
            loginError.innerText = error.message;
            loginError.classList.remove('hidden');
            loginError.classList.remove('text-emerald-500');
            loginError.classList.add('text-red-500');
        } else {
            loginError.innerText = "Password reset link sent! Please check your email.";
            loginError.classList.remove('hidden');
            loginError.classList.remove('text-red-500');
            loginError.classList.add('text-emerald-500');
            
            // Revert color after 5 seconds to not break future errors
            setTimeout(() => {
                loginError.classList.remove('text-emerald-500');
                loginError.classList.add('text-red-500');
                loginError.classList.add('hidden');
            }, 5000);
        }
        
        forgotPwdLink.innerText = originalText;
        forgotPwdLink.style.pointerEvents = "auto";
        forgotPwdLink.style.opacity = "1";
    });
}

// ----------------------------------------------------------------------
// Google Login Flow
// ----------------------------------------------------------------------
const googleLoginBtn = document.getElementById('google-login-btn');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        
        const originalText = googleLoginBtn.querySelector('span').innerText;
        googleLoginBtn.querySelector('span').innerText = "Redirecting...";
        googleLoginBtn.style.pointerEvents = "none";
        googleLoginBtn.style.opacity = "0.7";

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + import.meta.env.BASE_URL + 'dashboard.html'
            }
        });

        if (error) {
            loginError.innerText = error.message;
            loginError.classList.remove('hidden');
            googleLoginBtn.querySelector('span').innerText = originalText;
            googleLoginBtn.style.pointerEvents = "auto";
            googleLoginBtn.style.opacity = "1";
        }
        // If successful, the page redirects to Google, so we don't need to restore UI immediately
    });
}
