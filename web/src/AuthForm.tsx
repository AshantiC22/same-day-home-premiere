import {useState} from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type {User} from './types'
import {api, ApiError} from './api'

type AuthFormProps = {
    mode: 'login' | 'signup'
    onLoggedIn: (user: User) => void
}

function messageFor(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.detail === 'INVALID_CREDENTIALS') {
            return 'Wrong email or password.'
        }
        if (err.detail === 'ACCOUNT_LOCKED') {
            return 'Too many tries. Try again in 15 minutes.'
        }
        if (err.detail === 'EMAIL_TAKEN') {
            return 'That email is already registered.'
        }
        if (err.status === 422) {
            return 'Check your email and password and try again.'
        }
    }
    return 'Something went wrong. Try again.'
}

function postJson(body: object): RequestInit {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }
}

function AuthForm({ mode, onLoggedIn }: AuthFormProps) {
    const[email,setEmail] = useState('')
    const[password,setPassword] = useState('')
    const[error,setError] = useState<string | null>(null)
    const[busy,setBusy] = useState(false)

async function handleSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault()//stops browser from reloading whole page
    setBusy(true)
    setError(null)
    try {
        if (mode === 'signup') {
            await api<User>('/api/auth/signup', postJson({ email, password }))
        }
        const user = await api<User>('/api/auth/login', postJson({ email, password }))
        onLoggedIn(user)
    } catch (err) {
        setError(messageFor(err))
    } finally {
        setBusy(false)
    }
    
}

    return (
        <form onSubmit={handleSubmit}>
        <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
        <label htmlFor='email'>Email</label>
        <input
            id="email"
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
           
            <label htmlFor='password'>Password</label>
            <input
                id ="password"
                type="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>)=> setPassword(e.target.value)}
            />
        

        {error !== null && <p>{error}</p>}

        <button type='submit' disabled={busy}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
       
        
    )

}

export default AuthForm