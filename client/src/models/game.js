import Player from './player'
import Tiles from './tiles'
import Roads from './roads'
import Bank from './bank'
import Nodes from './nodes'
import Ports from './ports'

class Game {

  constructor(options) {
    this.bank = new Bank()
    this.player1 = options["player1"]
    this.player2 = options["player2"]
    this.player3 = options["player3"]
    this.player4 = options["player4"]
    this.players = []
    this.tilesArray = []
    this.roadsArray = []
    this.portsArray = []
    this.portTypesArray = ["sheep", "rock", "crop", "clay", "wood", "three_to_one", "three_to_one", "three_to_one", "three_to_one"]
    this.initialRobberIndex = undefined
    this.nodesArray = []
    this.turn = 0
    this.rolled = false
    this.developmentCardAllowed = true
    this.setup()
    this.mapNodesAroundTile()
    this.giveSurroundingRoadsToNodes()
    this.giveSurroundingNodesToRoads()
  }

  setup() {
    const player1 = new Player({name: this.player1.name, colour: "blue"})
    this.players.push(player1)
    const player2 = new Player({name: this.player2.name, colour: "red"})
    this.players.push(player2)
    const player3 = new Player({name: this.player3.name, colour: "white"})
    this.players.push(player3)
    const player4 = new Player({name: this.player4.name, colour: "yellow"})
    this.players.push(player4)

    const tiles = new Tiles()
    this.tilesArray = tiles.tilesArray
    this.initialRobberIndex = tiles.indexOfDesert
    const roads = new Roads()
    this.roadsArray = roads.roadsArray
    this.shuffle(this.portTypesArray)
    const nodes = new Nodes({portTypesArray: this.portTypesArray})
    this.nodesArray = nodes.nodesArray
    const ports = new Ports({portTypesArray: this.portTypesArray})
    this.portsArray = ports.portsArray

    ///////// just for testing purposes /////////

    /////////////////////////////////
  }

  shuffle(array) {
    for (let i = array.length; i; i--) {
      let rand = Math.floor(Math.random() * i);
      [array[i - 1], array[rand]] = [array[rand], array[i - 1]];
    }
  }

  giveSurroundingRoadsToNodes() {
    this.nodesArray.forEach((node) => {
      const nodeCoordinates = node.coordinates
      this.roadsArray.forEach((road) => {
        const roadCoordinates = road.coordinates
        if (Math.abs(nodeCoordinates[0] - (roadCoordinates[0] + 12)) < 60 && Math.abs(nodeCoordinates[1] - (roadCoordinates[1] + 12) ) < 60) {
          node.surroundingRoads.push(road.index)
        }
      }) 
    })
  }

  giveSurroundingNodesToRoads() {
    this.roadsArray.forEach((road) => {
      const roadCoordinates = road.coordinates
      this.nodesArray.forEach((node) => {
        const nodeCoordinates = node.coordinates
        if (Math.abs(nodeCoordinates[0] - (roadCoordinates[0] + 12)) < 60 && Math.abs(nodeCoordinates[1] - (roadCoordinates[1] + 12) ) < 60) {
          road.surroundingNodes.push(node.index)
        }
      }) 
    })
  }

  giveResourceCardToPlayer(player, type) {
    const newResCard = this.bank.generateResourceCard(type)
    player.resourceCards.push(newResCard)
  }

  giveHalfCardsAway(player) {
    const halfCards = Math.floor(player.resourceCards.length / 2)
    this.shuffle(player.resourceCards)
    player.resourceCards.splice(0, halfCards)
  }

  giveDevelopmentCardToPlayer(player, turn) {
    const newDevCard = this.bank.generateDevelopmentCard()
    newDevCard.buyingTurn = turn
    player.developmentCards.push(newDevCard)
  }

  letPlayerBuildRoad(player) {
    if (player.freeRoadCount) {
      player.freeRoadCount -= 1
      player.roadsAvailable -= 1
      return true
    }

    if (player.roadsAvailable === 0) {
      return false
    }
    let woodIndex = undefined
    let clayIndex = undefined
    for (let i = 0; i < player.resourceCards.length; i++) {
      if (player.resourceCards[i].type === "wood") {
        woodIndex = i
      }
      if(player.resourceCards[i].type === "clay") {
        clayIndex = i
      }
    }

    if (woodIndex !== undefined && clayIndex !== undefined) {
      player.roadsAvailable -= 1
      if (clayIndex > woodIndex) {
        player.resourceCards.splice(clayIndex, 1)
        player.resourceCards.splice(woodIndex, 1)
        return true
      } else {
        player.resourceCards.splice(woodIndex, 1)
        player.resourceCards.splice(clayIndex, 1)
        return true
      } 
    }
    return false
  }

  letPlayerBuildSettlement(player) {
    if (player.freeSettlementCount) {
      player.freeSettlementCount -= 1
      player.settlementsAvailable -= 1
      player.score += 1
      return true
    }

    if (player.settlementsAvailable === 0) {
      return false
    }
    let woodIndex = undefined
    let clayIndex = undefined
    let cropIndex = undefined
    let sheepIndex = undefined
    let indices = []
    for (let i = 0; i < player.resourceCards.length; i++) {
      if (player.resourceCards[i].type === "wood") {
        woodIndex = i
      }
      if(player.resourceCards[i].type === "clay") {
        clayIndex = i
      }
      if(player.resourceCards[i].type === "crop") {
        cropIndex = i
      }
      if(player.resourceCards[i].type === "sheep") {
        sheepIndex = i
      }
    }
    indices.push(...[woodIndex, clayIndex, cropIndex, sheepIndex])
    indices = indices.filter((index) => { 
      return index != undefined 
    })

    if (indices.length === 4) {
      indices.sort((a, b) => {
        return b - a
      })

      indices.forEach((index) => {
        player.resourceCards.splice(index, 1)
      })

      player.settlementsAvailable -= 1
      player.score += 1

      return true
    }
    return false
  }

  letPlayerBuyDevCard(player) {
    let rockIndex = undefined
    let cropIndex = undefined
    let sheepIndex = undefined
    let indices = []

    if (this.turn < 8 || !this.rolled) {
      return
    }

    for (let i = 0; i < player.resourceCards.length; i++) {
      if (player.resourceCards[i].type === "rock") {
        rockIndex = i
      }
      if(player.resourceCards[i].type === "crop") {
        cropIndex = i
      }
      if(player.resourceCards[i].type === "sheep") {
        sheepIndex = i
      }
    }
    indices.push(...[rockIndex, cropIndex, sheepIndex])
    indices = indices.filter((index) => { 
      return index != undefined 
    })

    if (indices.length === 3) {
      indices.sort((a, b) => {
        return b - a
      })

      indices.forEach((index) => {
        player.resourceCards.splice(index, 1)
      })
      return true
    }
    return false
  }

  letPlayerBuildCity(player) {
    if (player.citiesAvailable === 0) {
      return false
    }
    let cropCount = 0
    let rockCount = 0
    let indices = []
    for (let i = 0; i < player.resourceCards.length; i++) {
      if (player.resourceCards[i].type === "rock") {
        rockCount += 1
        if (rockCount <= 3) {
          indices.push(i)
        }
      }
      if(player.resourceCards[i].type === "crop") {
        cropCount += 1
        if (cropCount <= 2) {
          indices.push(i)
        }
      }
    }
    if (rockCount >= 3 && cropCount >= 2) {
      indices.sort((a, b) => {
        return b - a
      })
      indices.forEach((index) => {
        player.resourceCards.splice(index, 1)
      })
      player.citiesAvailable -= 1
      player.settlementsAvailable += 1
      player.score += 1

      return true
    }
    return false
  }

  //////////// GETTING CONQUERED TILES /////////////////////////////
  radar(player, index, turn) {
    const node = this.nodesArray[index]
    const nodeCoordinates = node.coordinates
    this.tilesArray.forEach((tile) => {
      const tileCoordinates = tile.coordinates
      if (Math.abs(nodeCoordinates[0] - (tileCoordinates[0] + 60)) < 100 && Math.abs(nodeCoordinates[1] - (tileCoordinates[1] + 69) ) < 100) {
        player.conqueredTiles.push(tile)
        ///// RESOURCES FOR SECOND SETTLEMENT /////
        if (tile.resource !== "desert" && turn > 3 && turn < 8) {
          const setupPhaseResource = this.bank.generateResourceCard(tile.resource)
          player.resourceCards.push(setupPhaseResource)
        }
      }
    })
  }

  mapConstructionAround(player, index) {
    const node = this.nodesArray[index]
    const nodeCoordinates = node.coordinates
    //////// BLOCK SURROUNDING NODES ///////////////////////////////
    this.nodesArray.forEach((surrNode) => {
      const surroundingNodeCoordinates = surrNode.coordinates
      if (Math.abs(nodeCoordinates[0] - (surroundingNodeCoordinates[0] + 12)) < 80 && Math.abs(nodeCoordinates[1] - (surroundingNodeCoordinates[1] + 12) ) < 90) {
        surrNode.allowConstruction = false
      }
    })
    this.nodesArray[index].allowConstruction = true
    //////// GET SURROUNDING ROADS ALLOWED TO BE BUILT //////////////
    this.roadsArray.forEach((surrRoad) => {
      const surroundingRoadCoordinates = surrRoad.coordinates
      if (Math.abs(nodeCoordinates[0] - (surroundingRoadCoordinates[0] + 12)) < 60 && Math.abs(nodeCoordinates[1] - (surroundingRoadCoordinates[1] + 12) ) < 60) {
        if (!player.roadsAllowed.includes(surrRoad.index)) {
          player.roadsAllowed.push(surrRoad.index)
        }
      }
    }) 
  }

  mapNodesAroundTile() {
    this.tilesArray.forEach((tile) => {
      const tileCoordinates = tile.coordinates
      this.nodesArray.forEach((surrNode) => {
        const surroundingNodeCoordinates = surrNode.coordinates
        if (
          Math.abs((tileCoordinates[0] + 60) - (surroundingNodeCoordinates[0] + 12)) < 80 && 
          Math.abs((tileCoordinates[1] + 69) - (surroundingNodeCoordinates[1] + 12)) < 90
          ) {
          tile.surroundingNodes.push(surrNode)
        }
      })
    })
  }

  mapNextPossibleRoads(player, index) {
    const road = this.roadsArray[index]
    const roadCoordinates = road.coordinates
    if (road.angle === 0) {
      this.roadsArray.forEach((surrRoad) => {
        const surroundingRoadCoordinates = surrRoad.coordinates
        if (Math.abs(roadCoordinates[0] - (surroundingRoadCoordinates[0] + 4)) < 60 && Math.abs(roadCoordinates[1] - (surroundingRoadCoordinates[1] + 19) ) < 80) {
          if (!player.roadsAllowed.includes(surrRoad.index)) {
            player.roadsAllowed.push(surrRoad.index)
          }
        }
      })
    }
    if (road.angle === 60) {
      this.roadsArray.forEach((surrRoad) => {
        const surroundingRoadCoordinates = surrRoad.coordinates
        if (Math.abs(roadCoordinates[0] - (surroundingRoadCoordinates[0] + 4)) < 80 && Math.abs(roadCoordinates[1] - (surroundingRoadCoordinates[1] + 19) ) < 80) {
          if (!player.roadsAllowed.includes(surrRoad.index)) {
            player.roadsAllowed.push(surrRoad.index)
          }
        }
      })
    }
    if (road.angle === -60) {
      this.roadsArray.forEach((surrRoad) => {
        const surroundingRoadCoordinates = surrRoad.coordinates
        if (Math.abs(roadCoordinates[0] - (surroundingRoadCoordinates[0] + 4)) < 80 && Math.abs(roadCoordinates[1] - (surroundingRoadCoordinates[1] + 19) ) < 80) {
          if (!player.roadsAllowed.includes(surrRoad.index)) {
            player.roadsAllowed.push(surrRoad.index)
          }
        }
      })
    }
  }

  checkForLongestRoadWinner(currentPlayer) {
    let returnStatement = true
    if (!currentPlayer.hasLongestRoad) {
      this.players.forEach((player) => {
        if (currentPlayer !== player && currentPlayer.longestRoad <= player.longestRoad 
          || currentPlayer.longestRoad < 5) {
          returnStatement = false
        } 
        else if (currentPlayer !== player 
          && player.hasLongestRoad === true) {
          player.hasLongestRoad = false
          player.score -= 2
        }
      })
      if (returnStatement) {
        currentPlayer.score += 2
        currentPlayer.hasLongestRoad = true
      }
    }
  }

  updateTurn(turn) {
    this.turn = turn
  }

}

export default Game