
// $(document).ready(function () {


// });


function createGridLayer() {
  var gridLayer = new Konva.Layer({ id: 'gridLayer' });
  for (let x = 0; x < 15; x++) {
    for (let y = 0; y < 10; y++) { // this is dependant on strength
      var rect = new Konva.Rect({
        x: x * 80,
        y: y * 80,
        width: 79,
        height: 79,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 1,
      });
      gridLayer.add(rect)
    }
  }
  return gridLayer;
}

function InitializeMenu() {

  // setup menu
  let currentShape;
  var menuNode = document.getElementById('menu');
  document.getElementById('rotate-button').addEventListener('click', () => {
    
    var itemGroup = currentShape.parent.parent;
    itemGroup.rotate(90);


    // itemGroup.find('.itemText')[0].rotate(-90);
    // itemGroup.find('.itemText')[0].setAttr('y', itemGroup.find('.itemText')[0].getAttr('y') + 80)
  });

  document.getElementById('flip-button').addEventListener('click', () => {

    var scaleX = currentShape.parent.parent.scaleX();
    if (scaleX > 0){
      currentShape.parent.parent.scaleX(-Math.abs(currentShape.scaleX()))

      var text = currentShape.parent.parent.find('.itemText')[0].find('.text')[0];
      text.scaleX(-Math.abs(text.scaleX()))
      text.setAttr('x', text.getAttr('x') + 80)
      text.setAttr('y', text.getAttr('y') + 80)
    }
    else{
      currentShape.parent.parent.scaleX(Math.abs(currentShape.scaleX()))

      var text = currentShape.parent.parent.find('.itemText')[0].find('.text')[0];
      text.scaleX(Math.abs(text.scaleX()))
      text.setAttr('x', text.getAttr('x') - 80)
      text.setAttr('y', text.getAttr('y') - 80)

    }

  });
  document.getElementById('delete-button').addEventListener('click', () => {
    currentShape.parent.destroy();
  });

  window.addEventListener('click', () => {
    // hide menu
    menuNode.style.display = 'none';
  });

  stage.on('contextmenu', function (e) {
    // prevent default behavior
    e.evt.preventDefault();
    if (e.target === stage) {
      // if we are on empty place of the stage we will do nothing
      return;
    }
    currentShape = e.target;

    if (currentShape.getLayer().getAttr('id') === 'gridLayer')//so they can't manipulate the grid.
      return;

    if (currentShape.parent.getAttr('name') == 'itemText'){
      currentShape = currentShape.parent.parent.find('.itemShapes')[0].children[0];
    }

    // show menu
    menuNode.style.display = 'initial';
    var containerRect = stage.container().getBoundingClientRect();
    menuNode.style.top =
      containerRect.top + stage.getPointerPosition().y + 4 + 'px';
    menuNode.style.left =
      containerRect.left + stage.getPointerPosition().x + 4 + 'px';
  });

}

function InitializeCollisionSnapping() {

  //guidelines demo
  // were can we snap our objects?
  function getLineGuideStops(skipShape) {
    // we can snap to stage borders and the center of the stage
    var vertical = [0, stage.width()];
    var horizontal = [0, stage.height()];

    for (let i = 0; i < 30; i++) {//change top be dynamic to stage size.
      vertical.push(i * 40);
      horizontal.push(i * 40);
    }
    return {
      vertical: vertical.flat(),
      horizontal: horizontal.flat(),
    };
  }

  // what points of the object will trigger to snapping?
  // it can be just center of the object
  // but we will enable all edges and center
  function getObjectSnappingEdges(node) {
    var box = node.find('.itemShapes')[0].getClientRect();
    var absPos = node.absolutePosition();

    return {
      vertical: [
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snap: 'start',
        },
        // {
        //   guide: Math.round(box.x + box.width / 2),
        //   offset: Math.round(absPos.x - box.x - box.width / 2),
        //   snap: 'center',
        // },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snap: 'end',
        },
      ],
      horizontal: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snap: 'start',
        },
        // {
        //   guide: Math.round(box.y + box.height / 2),
        //   offset: Math.round(absPos.y - box.y - box.height / 2),
        //   snap: 'center',
        // },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snap: 'end',
        },
      ],
    };
  }

  // find all snapping possibilities
  function getGuides(lineGuideStops, itemBounds) {
    var resultV = [];
    var resultH = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        var diff = Math.abs(lineGuide - itemBound.guide);
        // if the distance between guild line and object snap point is close we can consider this for snapping
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        var diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    var guides = [];

    // find closest snap
    var minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    var minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: 'V',
        snap: minV.snap,
      });
    }
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: 'H',
        snap: minH.snap,
      });
    }
    return guides;
  }

  function drawGuides(guides) {
    guides.forEach((lg) => {
      if (lg.orientation === 'H') {
        var line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guid-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: 0,
          y: lg.lineGuide,
        });
      } else if (lg.orientation === 'V') {
        var line = new Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guid-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: lg.lineGuide,
          y: 0,
        });
      }
    });
  }

  layer.on('dragmove', function (e) {
    // clear all previous lines on the screen
    layer.find('.guid-line').forEach((l) => l.destroy());

    e.target.moveToTop();

    // find possible snapping lines
    var lineGuideStops = getLineGuideStops(e.target);
    // find snapping points of current object
    var itemBounds = getObjectSnappingEdges(e.target);

    // now find where can we snap current object
    var guides = getGuides(lineGuideStops, itemBounds);

    // do nothing of no snapping
    if (!guides.length) {
      return;
    }

    //drawGuides(guides); //Lines cause error from collision logic. Can label lines to not be checked for collision OR just not have them

    var absPos = e.target.absolutePosition();
    // now force object position
    guides.forEach((lg) => {
      switch (lg.snap) {
        case 'start': {
          switch (lg.orientation) {
            case 'V': {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case 'H': {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
          }
          break;
        }
        // case 'center': {
        //   switch (lg.orientation) {
        //     case 'V': {
        //       absPos.x = lg.lineGuide + lg.offset;
        //       break;
        //     }
        //     case 'H': {
        //       absPos.y = lg.lineGuide + lg.offset;
        //       break;
        //     }
        //   }
        //   break;
        // }
        case 'end': {
          switch (lg.orientation) {
            case 'V': {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case 'H': {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
          }
          break;
        }
      }
    });
    e.target.absolutePosition(absPos);
  });

  layer.on('dragend', function (e) {
    // clear all previous lines on the screen
    layer.find('.guid-line').forEach((l) => l.destroy());
  });

  //collision logic
  layer.on('dragmove', function (e) {
    var target = e.target;

    layer.children.forEach(function (shape) {
      shape.find('Rect').forEach(function (square) {
        square.setAttr('isColliding', false)
      })
    })

    //loop through target (shape being dragged) boxes
    target.find('Rect').forEach(function (square) {
      //square.setAttr('isColliding', false)
      //loop through each other shapes
      layer.children.forEach(function (group) {
        // do not check intersection with itself
        if (group === target) {
          return;
        }

        //loop through each of that shapes boxes
        group.find('Rect').forEach(function (rect) {
          //rect.setAttr('isColliding', false)
          if (haveIntersection(rect.getClientRect(), square.getClientRect())) {
            rect.fill('red')
            rect.setAttr('isColliding', true)
            square.fill('red')
            square.setAttr('isColliding', true)
          } else {
            if (!rect.getAttr('isColliding'))
              rect.fill(rect.getAttr('fillColour'))
            if (!square.getAttr('isColliding'))
              square.fill(square.getAttr('fillColour'))
          }
        })
      })
    })
  });

  function haveIntersection(r1, r2) {
    return !(
      r2.x > (r1.x + r1.width) - 1 ||
      (r2.x + r2.width) - 1 < r1.x ||
      r2.y > (r1.y + r1.height) - 1 ||
      (r2.y + r2.height) - 1 < r1.y
    );
  }

}
