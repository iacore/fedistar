import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Content, List } from 'rsuite'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import { Virtuoso } from 'react-virtuoso'
import Status from '../timelines/status/Status'

type Props = {
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
}

export default function TagDetail(props: Props) {
  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [server, setServer] = useState<Server | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [tag, setTag] = useState('')
  const router = useRouter()

  useEffect(() => {
    const f = async () => {
      let cli: MegalodonInterface
      if (router.query.account_id && router.query.server_id) {
        const [account, server] = await invoke<[Account, Server]>('get_account', {
          id: parseInt(router.query.account_id.toLocaleString())
        })
        setServer(server)
        setAccount(account)
        cli = generator(server.sns, server.base_url, account.access_token, 'Fedistar')
        setClient(cli)
      } else if (router.query.server_id) {
        const server = await invoke<Server>('get_server', { id: parseInt(router.query.server_id.toString()) })
        setServer(server)
        setAccount(null)
        cli = generator(server.sns, server.base_url, undefined, 'Fedistar')
        setClient(cli)
      }
      if (router.query.tag) {
        setTag(router.query.tag.toString())
      }
    }
    f()
  }, [router.query.tag, router.query.server_id, router.query.account_id])

  useEffect(() => {
    if (tag && client) {
      const f = async () => {
        const res = await client.getTagTimeline(tag)
        setStatuses(res.data)
      }
      f()
    }
  }, [tag, client])

  const updateStatus = (status: Entity.Status) => {
    const renew = statuses.map(s => {
      if (s.id === status.id) {
        return status
      } else if (s.reblog && s.reblog.id === status.id) {
        return Object.assign({}, s, { reblog: status })
      } else if (status.reblog && s.id === status.reblog.id) {
        return status.reblog
      } else if (status.reblog && s.reblog && s.reblog.id === status.reblog.id) {
        return Object.assign({}, s, { reblog: status.reblog })
      } else {
        return s
      }
    })
    setStatuses(renew)
  }

  const setAccountDetail = (userId: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { user_id: userId, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { user_id: userId, server_id: serverId } })
    }
  }

  const setTagDetail = (tag: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { tag: tag, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { tag: tag, server_id: serverId } })
    }
  }

  return (
    <Content style={{ height: '100%', backgroundColor: 'var(--rs-gray-800)', overflowY: 'scroll' }}>
      <List style={{ height: '100%' }}>
        <Virtuoso
          style={{ height: '100%' }}
          data={statuses}
          itemContent={(_, status) => (
            <List.Item key={status.id} style={{ paddingTop: '2px', paddingBottom: '2px', backgroundColor: 'var(--rs-gray-800)' }}>
              <Status
                status={status}
                client={client}
                server={server}
                account={account}
                updateStatus={updateStatus}
                openMedia={props.openMedia}
                setReplyOpened={() => null}
                setAccountDetail={setAccountDetail}
                setTagDetail={setTagDetail}
                openReport={props.openReport}
                openFromOtherAccount={props.openFromOtherAccount}
              />
            </List.Item>
          )}
        />
      </List>
    </Content>
  )
}
