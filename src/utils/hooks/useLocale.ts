import { useEffect } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import appConfig from '@/configs/app.config'

const useLocale = () => {
    const locale = appConfig.locale

    useEffect(() => {
        dayjs.locale(locale)
    }, [locale])

    return {
        locale,
    }
}

export default useLocale
