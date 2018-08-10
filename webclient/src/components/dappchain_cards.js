import React from 'react'
import Card from './card'

export default class DAppChainCards extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      account: '0x',
      ethAccount: '0x',
      cardIds: [],
      allowing: false
    }
  }

  async componentWillMount() {
    this.props.dcGatewayManager.onTokenWithdrawal(async event => {
      alert(`Card id ${event.value.toNumber()} ready for withdraw, check Cards On Gateway`)
      await this.updateUI()
    })

    await this.updateUI()
  }

  async updateUI() {
    const ethAccount = await this.props.ethAccountManager.getCurrentAccountAsync()
    const account = this.props.dcAccountManager.getCurrentAccount()
    const balance = await this.props.dcCardManager.getBalanceOfUserAsync(account)
    const mapping = await this.props.dcAccountManager.getAddressMappingAsync(ethAccount)

    let cardIds = []

    if (balance > 0) {
      cardIds = await this.props.dcCardManager.getTokensCardsOfUserAsync(account, balance)
    }

    this.setState({ account, cardIds, ethAccount, mapping })
  }

  async allowToWithdraw(cardId) {
    this.setState({ allowing: true })
    await this.props.dcCardManager.approveAsync(this.state.account, cardId)

    try {
      await this.props.dcGatewayManager.withdrawCardAsync(
        cardId,
        this.props.dcCardManager.getContractAddress()
      )

      alert('Processing allowance')
    } catch (err) {
      if (err.message.indexOf('pending') > -1) {
        alert('Pending withdraw exists, check Cards On Gateway')
      } else {
        console.error(err)
      }
    }

    this.setState({ allowing: false })

    await this.updateUI()
  }

  render() {
    const cards = this.state.cardIds.map((cardId, idx) => {
      const cardDef = this.props.dcCardManager.getCardWithId(cardId)
      return (
        <Card
          title={cardDef.title}
          description={cardDef.description}
          key={idx}
          action="Allow Withdraw"
          disabled={this.state.allowing}
          handleOnClick={() => this.allowToWithdraw(cardId)}
        />
      )
    })

    const view = !this.state.mapping ? (
      <p>Please sign your user first</p>
    ) : cards.length > 0 ? (
      cards
    ) : (
      <p>No cards deposited on DAppChain yet</p>
    )

    return (
      <div>
        <h2>DAppChain Available Cards</h2>
        <div className="container">
          <div>{view}</div>
        </div>
      </div>
    )
  }
}
