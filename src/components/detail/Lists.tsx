import { Header, FlexboxGrid, Button, Content, List } from 'rsuite'
import { BsX, BsChevronLeft, BsListUl, BsPencil } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { invoke } from '@tauri-apps/api/tauri'

import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'

type Props = {}

export default function ListsDetail(props: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [lists, setLists] = useState<Array<Entity.List>>([])

  useEffect(() => {
    if (!router.query.account_id || !router.query.server_id) return
    const f = async () => {
      const [account, server] = await invoke<[Account, Server]>('get_account', {
        id: parseInt(router.query.account_id.toLocaleString())
      })
      const cli = generator(server.sns, server.base_url, account.access_token, 'Fedistar')
      setClient(cli)
    }
    f()
  }, [router.query.server_id, router.query.account_id])

  useEffect(() => {
    if (!client) return
    const f = async () => {
      const res = await client.getLists()
      setLists(res.data)
    }
    f()
  }, [client])

  const back = () => {
    router.back()
  }

  return (
    <>
      <Header style={{ backgroundColor: 'var(--rs-gray-700)' }}>
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={back}>
              <Icon as={BsChevronLeft} style={{ fontSize: '1.4em' }} />
              {t('detail.back')}
            </Button>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={close} title={t('detail.close')}>
              <Icon as={BsX} style={{ fontSize: '1.4em' }} />
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Header>
      <Content style={{ height: '100%', backgroundColor: 'var(--rs-gray-800)' }}>
        <List style={{ height: '100%' }}>
          {lists.map((list, index) => (
            <List.Item key={index} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <FlexboxGrid align="middle">
                  <FlexboxGrid.Item style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 1em' }}>
                    <Icon as={BsListUl} />
                  </FlexboxGrid.Item>
                  <FlexboxGrid.Item>
                    <div>{list.title}</div>
                  </FlexboxGrid.Item>
                </FlexboxGrid>
                <div style={{ paddingRight: '1em' }}>
                  <Icon as={BsPencil} />
                </div>
              </div>
            </List.Item>
          ))}
        </List>
      </Content>
    </>
  )
}
