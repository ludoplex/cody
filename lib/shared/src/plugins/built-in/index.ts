import { Plugin } from '../api/types'

import { airQualityPlugin } from './air-quality'
import { confluencePlugin } from './confluence'
import { githubIssuesPlugin } from './github-issues'
import { timezonePlugin } from './timezone'
import { urlReaderPlugin } from './url-reader'
import { weatherPlugin } from './weather'

export const defaultPlugins: Plugin[] = [
    weatherPlugin,
    timezonePlugin,
    airQualityPlugin,
    urlReaderPlugin,
    confluencePlugin,
    githubIssuesPlugin,
].sort((a, b) => a.name.localeCompare(b.name))
