import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Content, List, Header, FlexboxGrid, Button, Loader } from 'rsuite'
import { BsX, BsChevronLeft, BsPin, BsPersonPlus, BsPersonX } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'

import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import { Virtuoso } from 'react-virtuoso'
import Status from '../timelines/status/Status'
import { FormattedMessage, useIntl } from 'react-intl'

type Props = {
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
}

export default function TagDetail(props: Props) {
  const { formatMessage } = useIntl()
  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [server, setServer] = useState<Server | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [tag, setTag] = useState('')
  const [hashtag, setHashtag] = useState<Entity.Tag | null>(null)
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
        const t = await client.getTag(tag)
        setHashtag(t.data)
        console.log(t.data)
      }
      f()
    }
  }, [tag, client])

  const back = () => {
    router.back()
  }

  const close = () => {
    router.push({ query: {} })
  }

  const addTimeline = async () => {
    if (tag.length <= 0) {
      return
    }
    await invoke('add_timeline', { server: server, kind: 'tag', name: tag, listId: null })
  }

  const followHashtag = async () => {
    if (hashtag && client) {
      await client.followTag(hashtag.name)
      const t = await client.getTag(hashtag.name)
      setHashtag(t.data)
    }
  }

  const unfollowHashtag = async () => {
    if (hashtag && client) {
      await client.unfollowTag(hashtag.name)
      const t = await client.getTag(hashtag.name)
      setHashtag(t.data)
    }
  }

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
    <>
      <Header style={{ backgroundColor: 'var(--rs-gray-700)' }}>
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={back}>
              <Icon as={BsChevronLeft} style={{ fontSize: '1.4em' }} />
              <FormattedMessage id="detail.back" />
            </Button>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            {hashtag && hashtag.following && (
              <Button appearance="link" onClick={unfollowHashtag} title={formatMessage({ id: 'detail.unfollow_tag' })}>
                <Icon as={BsPersonX} style={{ fontSize: '1.2em' }} />
              </Button>
            )}
            {hashtag && !hashtag.following && (
              <Button appearance="link" onClick={followHashtag} title={formatMessage({ id: 'detail.follow_tag' })}>
                <Icon as={BsPersonPlus} style={{ fontSize: '1.2em' }} />
              </Button>
            )}

            <Button appearance="link" onClick={addTimeline} title={formatMessage({ id: 'detail.pin' })}>
              <Icon as={BsPin} style={{ fontSize: '1.2em' }} />
            </Button>
            <Button appearance="link" onClick={close} title={formatMessage({ id: 'detail.close' })}>
              <Icon as={BsX} style={{ fontSize: '1.4em' }} />
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Header>
      {statuses.length === 0 ? (
        <Loader style={{ margin: '10em auto' }} />
      ) : (
        <Content style={{ height: '100%', backgroundColor: 'var(--rs-gray-800)' }}>
          <List style={{ height: '100%' }}>
            <Virtuoso
              style={{ height: '100%' }}
              data={statuses}
              className="timeline-scrollable"
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
      )}
    </>
  )
}
