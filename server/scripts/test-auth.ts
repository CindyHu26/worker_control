
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../src/middleware/auth';
// Mock Express types since we aren't running real server
// @ts-ignore
const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => { res.statusCode = code; return res; };
    res.sendStatus = (code: number) => { res.statusCode = code; return res; };
    res.json = (data: any) => { res.data = data; return res; };
    return res;
};

// @ts-ignore
const mockNext = () => {
    let called = false;
    const next = () => { called = true; };
    next.isCalled = () => called;
    return next;
};

async function testAuth() {
    console.log("=== Testing Auth Middleware ===");

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    // 1. Test No Header
    {
        const req: any = { headers: {} };
        const res = mockResponse();
        const next = mockNext();

        authenticateToken(req, res, next);

        console.log(`No Header: Status ${res.statusCode} (Expected 401)`);
        if (res.statusCode !== 401) throw new Error("Auth Fail: No Header should be 401");
    }

    // 2. Test Invalid Token
    {
        const req: any = { headers: { 'authorization': 'Bearer invalid-token' } };
        const res = mockResponse();
        const next = mockNext();
        authenticateToken(req, res, next);

        // jwt.verify is async/callback based in the middleware, generally runs sync if no callback? 
        // Wait, the middleware uses callback: jwt.verify(token, secret, (err, user) => ...)
        // This makes the middleware async effectively, but it doesn't return a promise. 
        // We need to wait a tick? Or use spy? 
        // Since we can't easily wait for the internal callback, we'll wait a tiny bit.
        await new Promise(r => setTimeout(r, 100));

        console.log(`Invalid Token: Status ${res.statusCode} (Expected 403)`);
        if (res.statusCode !== 403) throw new Error("Auth Fail: Invalid Token should be 403");
    }

    // 3. Test Valid Token
    {
        const token = jwt.sign({ id: 'user1', role: 'admin' }, JWT_SECRET);
        const req: any = { headers: { 'authorization': `Bearer ${token}` } };
        const res = mockResponse();
        const next = mockNext();

        authenticateToken(req, res, next);

        await new Promise(r => setTimeout(r, 100));

        console.log(`Valid Token: Next Called? ${next.isCalled()} (Expected true)`);
        if (!next.isCalled()) throw new Error("Auth Fail: Valid Token should call next()");
        console.log(`User attached? ${req.user.id} (Expected user1)`);
        if (req.user.id !== 'user1') throw new Error("Auth Fail: User not attached");
    }

    console.log("=== Auth Test Passed ===");
}

testAuth().catch(console.error);
