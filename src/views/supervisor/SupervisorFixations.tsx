import { useState } from 'react'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Tabs from '@/components/ui/Tabs'
import { TbCalendarTime, TbRotateClockwise } from 'react-icons/tb'
import ExtendRequestsTab from './components/ExtendRequestsTab'
import RestoreFixationsTab from './components/RestoreFixationsTab'

const { TabList, TabNav, TabContent } = Tabs

const SupervisorFixations = () => {
    const [currentTab, setCurrentTab] = useState('extend_requests')

    return (
        <Container>
            {/* Заголовок страницы */}
            <div className="mb-6">
                <h3 className="mb-1">Управление фиксациями</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Управление запросами на продление и восстановлением фиксаций
                </p>
            </div>

            <AdaptiveCard>
                <Tabs value={currentTab} onChange={(val) => setCurrentTab(val)}>
                    <TabList className="mb-6">
                        <TabNav
                            value="extend_requests"
                            icon={<TbCalendarTime className="text-lg" />}
                            className="!px-3 sm:!px-5"
                        >
                            Запросы на продление
                        </TabNav>
                        <TabNav
                            value="restore_fixations"
                            icon={<TbRotateClockwise className="text-lg" />}
                            className="!px-3 sm:!px-5"
                        >
                            Восстановление фиксаций
                        </TabNav>
                    </TabList>

                    <TabContent value="extend_requests">
                        <ExtendRequestsTab />
                    </TabContent>

                    <TabContent value="restore_fixations">
                        <RestoreFixationsTab />
                    </TabContent>
                </Tabs>
            </AdaptiveCard>
        </Container>
    )
}

export default SupervisorFixations
