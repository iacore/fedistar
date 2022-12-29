import { Entity, MegalodonInterface } from 'megalodon'
import Follow from './Follow'
import Reaction from './Reaction'
import Status from '../status/Status'
import { Server } from 'src/entities/server'

type Props = {
  notification: Entity.Notification
  client: MegalodonInterface
  server: Server
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Entity.Attachment) => void
  setReplyOpened: (opened: boolean) => void
  setStatusDetail: (status: Entity.Status, server: Server, client: MegalodonInterface) => void
}

const notification = (props: Props) => {
  switch (props.notification.type) {
    case 'follow':
    case 'follow_request':
      return <Follow notification={props.notification} />
    case 'favourite':
    case 'reblog':
    case 'poll_expired':
    case 'poll_vote':
    case 'quote':
    case 'status':
    case 'emoji_reaction':
      return <Reaction notification={props.notification} openMedia={props.openMedia} />
    case 'mention':
      return (
        <Status
          client={props.client}
          status={props.notification.status}
          server={props.server}
          updateStatus={props.updateStatus}
          openMedia={props.openMedia}
          setReplyOpened={props.setReplyOpened}
          setStatusDetail={props.setStatusDetail}
        />
      )
    default:
      return null
  }
}

const Notification: React.FC<Props> = props => {
  return notification(props)
}

export default Notification
