import { mock } from './MockAdapter'
import './fakeApi/commonFakeApi'
import './fakeApi/accountsFakeApi'
import './fakeApi/fixationsFakeApi'
import './fakeApi/helpCenterFakeApi'

mock.onAny().passThrough()
