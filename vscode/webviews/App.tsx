import { useCallback, useEffect, useState } from 'react'

import './App.css'

import { uniq, without } from 'lodash'

import { ChatContextStatus } from '@sourcegraph/cody-shared/src/chat/context'
import { ChatHistory, ChatMessage } from '@sourcegraph/cody-shared/src/chat/transcript/messages'
import { Configuration } from '@sourcegraph/cody-shared/src/configuration'

import { AuthStatus, defaultAuthStatus, LocalEnv } from '../src/chat/protocol'

import { Chat } from './Chat'
import { Debug } from './Debug'
import { Header } from './Header'
import { LoadingPage } from './LoadingPage'
import { Login } from './Login'
import { NavBar, View } from './NavBar'
import { Plugins } from './Plugins'
import { Recipes } from './Recipes'
import { Settings } from './Settings'
import { UserHistory } from './UserHistory'
import type { VSCodeWrapper } from './utils/VSCodeApi'

export const App: React.FunctionComponent<{ vscodeAPI: VSCodeWrapper }> = ({ vscodeAPI }) => {
    const [config, setConfig] = useState<
        | (Pick<Configuration, 'debugEnable' | 'serverEndpoint' | 'pluginsEnabled' | 'pluginsDebugEnabled'> & LocalEnv)
        | null
    >(null)
    const [endpoint, setEndpoint] = useState<string | null>(null)
    const [debugLog, setDebugLog] = useState<string[]>([])
    const [view, setView] = useState<View | undefined>()
    const [messageInProgress, setMessageInProgress] = useState<ChatMessage | null>(null)
    const [messageBeingEdited, setMessageBeingEdited] = useState<boolean>(false)
    const [transcript, setTranscript] = useState<ChatMessage[]>([])
    const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
    const [formInput, setFormInput] = useState('')
    const [inputHistory, setInputHistory] = useState<string[] | []>([])
    const [userHistory, setUserHistory] = useState<ChatHistory | null>(null)
    const [contextStatus, setContextStatus] = useState<ChatContextStatus | null>(null)
    const [errorMessages, setErrorMessages] = useState<string[]>([])
    const [suggestions, setSuggestions] = useState<string[] | undefined>()
    const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false)
    const [enabledPlugins, setEnabledPlugins] = useState<string[]>([])
    const [myPrompts, setMyPrompts] = useState<string[] | null>(null)

    useEffect(
        () =>
            vscodeAPI.onMessage(message => {
                switch (message.type) {
                    case 'transcript': {
                        if (message.isMessageInProgress) {
                            const msgLength = message.messages.length - 1
                            setTranscript(message.messages.slice(0, msgLength))
                            setMessageInProgress(message.messages[msgLength])
                        } else {
                            setTranscript(message.messages)
                            setMessageInProgress(null)
                        }
                        break
                    }
                    case 'config':
                        setConfig(message.config)
                        setIsAppInstalled(message.config.isAppInstalled)
                        setEndpoint(message.authStatus.endpoint)
                        setAuthStatus(message.authStatus)
                        setView(message.authStatus.isLoggedIn ? 'chat' : 'login')
                        break
                    case 'login':
                        break
                    case 'showTab':
                        if (message.tab === 'chat') {
                            setView('chat')
                        }
                        break
                    case 'debug':
                        setDebugLog([...debugLog, message.message])
                        break
                    case 'history':
                        setInputHistory(message.messages?.input ?? [])
                        setUserHistory(message.messages?.chat ?? null)
                        break
                    case 'contextStatus':
                        setContextStatus(message.contextStatus)
                        break
                    case 'errors':
                        setErrorMessages([...errorMessages, message.errors].slice(-5))
                        setDebugLog([...debugLog, message.errors])
                        break
                    case 'view':
                        setView(message.messages)
                        break
                    case 'suggestions':
                        setSuggestions(message.suggestions)
                        break
                    case 'app-state':
                        setIsAppInstalled(message.isInstalled)
                        break
                    case 'enabled-plugins':
                        setEnabledPlugins(message.plugins)
                        break
                    case 'my-prompts':
                        setMyPrompts(message.isEnabled ? message.prompts : null)
                        break
                }
            }),
        [debugLog, errorMessages, view, vscodeAPI]
    )

    useEffect(() => {
        // Notify the extension host that we are ready to receive events
        vscodeAPI.postMessage({ command: 'ready' })
    }, [vscodeAPI])

    useEffect(() => {
        if (!view) {
            vscodeAPI.postMessage({ command: 'initialized' })
        }
    }, [view, vscodeAPI])

    const onLogout = useCallback(() => {
        setConfig(null)
        setEndpoint(null)
        setAuthStatus(defaultAuthStatus)
        setView('login')
        vscodeAPI.postMessage({ command: 'auth', type: 'signout' })
    }, [vscodeAPI])

    const onLoginRedirect = useCallback(
        (uri: string) => {
            setConfig(null)
            setEndpoint(null)
            setAuthStatus(defaultAuthStatus)
            setView('login')
            vscodeAPI.postMessage({ command: 'auth', type: 'callback', endpoint: uri })
        },
        [setEndpoint, vscodeAPI]
    )

    const onPluginToggle = useCallback(
        (pluginName: string, enabled: boolean) => {
            const newPlugins = enabled ? uniq([...enabledPlugins, pluginName]) : without(enabledPlugins, pluginName)
            vscodeAPI.postMessage({ command: 'setEnabledPlugins', plugins: newPlugins })
            setEnabledPlugins(newPlugins)
        },
        [enabledPlugins, vscodeAPI]
    )

    if (!view || !authStatus || !config) {
        return <LoadingPage />
    }

    return (
        <div className="outer-container">
            <Header endpoint={authStatus.isLoggedIn ? endpoint : null} />
            {view === 'login' || !authStatus.isLoggedIn ? (
                <Login
                    authStatus={authStatus}
                    endpoint={endpoint}
                    isAppInstalled={isAppInstalled}
                    isAppRunning={config?.isAppRunning}
                    vscodeAPI={vscodeAPI}
                    appOS={config?.os}
                    appArch={config?.arch}
                    callbackScheme={config?.uriScheme}
                    onLoginRedirect={onLoginRedirect}
                />
            ) : (
                <>
                    <NavBar
                        view={view}
                        setView={setView}
                        devMode={Boolean(config?.debugEnable)}
                        pluginsEnabled={Boolean(config?.pluginsEnabled)}
                    />
                    {errorMessages && <ErrorBanner errors={errorMessages} setErrors={setErrorMessages} />}
                    {view === 'debug' && config?.debugEnable && <Debug debugLog={debugLog} />}
                    {view === 'history' && (
                        <UserHistory
                            userHistory={userHistory}
                            setUserHistory={setUserHistory}
                            setInputHistory={setInputHistory}
                            setView={setView}
                            vscodeAPI={vscodeAPI}
                        />
                    )}
                    {view === 'recipes' && endpoint && <Recipes vscodeAPI={vscodeAPI} myPrompts={myPrompts} />}
                    {view === 'settings' && endpoint && (
                        <Settings onLogout={onLogout} endpoint={endpoint} version={config?.extensionVersion} />
                    )}
                    {view === 'chat' && (
                        <Chat
                            messageInProgress={messageInProgress}
                            messageBeingEdited={messageBeingEdited}
                            setMessageBeingEdited={setMessageBeingEdited}
                            transcript={transcript}
                            contextStatus={contextStatus}
                            formInput={formInput}
                            setFormInput={setFormInput}
                            inputHistory={inputHistory}
                            setInputHistory={setInputHistory}
                            vscodeAPI={vscodeAPI}
                            suggestions={suggestions}
                            pluginsDevMode={Boolean(config?.pluginsDebugEnabled)}
                            setSuggestions={setSuggestions}
                        />
                    )}
                </>
            )}

            {config.pluginsEnabled && view === 'plugins' && (
                <Plugins plugins={enabledPlugins} onPluginToggle={onPluginToggle} />
            )}
        </div>
    )
}

const ErrorBanner: React.FunctionComponent<{ errors: string[]; setErrors: (errors: string[]) => void }> = ({
    errors,
    setErrors,
}) => (
    <div className="error-container">
        {errors.map((error, i) => (
            <div key={i} className="error">
                <span>{error}</span>
                <button type="button" className="close-btn" onClick={() => setErrors(errors.filter(e => e !== error))}>
                    ×
                </button>
            </div>
        ))}
    </div>
)
