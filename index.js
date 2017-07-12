import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Animated, View, PanResponder, Dimensions } from 'react-native';

const screen = Dimensions.get("window");

class VerticalSwipe extends Component {
  _panResponder = null;
  _movable = null;
  _initialPositionTop = null;
  _hasActivatedThreshold = false;
  stylesheets = null;

  static propTypes: {
    // Amount of pixel the user can use to swipe the window in
    swipeOffset: PropTypes.number.isRequired,
    // Threshold after which window is considered opened when moving
    openSwipeThreshold: PropTypes.number.isRequired,
    // Threshold after which window is considered closed when moving
    closeSwipeThreshold: PropTypes.number.isRequired,
    // The offset to stop when opening
    offsetTop: PropTypes.number.isRequired,
  };

  static defaultProps = {
    swipeOffset: 100,
    openSwipeThreshold: 100,
    closeSwipeThreshold: 50,
    offsetTop: 0,
  };

  initialize = () => {
    this._initialPositionTop = Math.floor(screen.height - this.props.swipeOffset);

    this.state = {
      isAnimating: false,
      isOpen: false,
      positionTop: new Animated.Value(this._initialPositionTop),
    };

    const styles = {
      container: {
        flex: 1,
      },
      swiper: {
        // We put a transparent background color as a hack because otherwise, moving doesn't work
        backgroundColor: "rgba(0, 0, 0, 0)",
        width: "100%",
        height: screen.height + 75 - this.props.offsetTop, // this.props.swipeOffset,
        position: "absolute",
        left: 0,
        top: this._initialPositionTop,
      },
      innerBottom: {
        marginTop: this.props.swipeOffset,
      },
    };

    this.stylesheets = StyleSheet.create(styles);
    this.stylesheets.content = this.props.style;
  };

  onStartShouldSetPanResponder = (evt) => {
    if(this.state.isAnimating === true){
      return false;
    }

    if(this.state.isOpen){
      if(evt.nativeEvent.pageY < (this.props.openSwipeThreshold + this.props.offsetTop) && evt.nativeEvent.pageY > this.props.offsetTop){
        return true;
      }

      return false;
    }

    return true;
  };

  onPanResponderMove = (evt, gestureState) => {
    if(this.state.isAnimating === true){
      return;
    }

    if(this.state.isOpen === false){
      if(gestureState.dy < -(this.props.openSwipeThreshold) && this._hasActivatedThreshold === false){
        this._hasActivatedThreshold = true;
      } else if(gestureState.dy >= -(this.props.openSwipeThreshold) && this._hasActivatedThreshold === true){
        this._hasActivatedThreshold = false;
      }

      this._movable.setNativeProps({
        style: [this.stylesheets.swiper, {
          top: screen.height - this.props.swipeOffset + gestureState.dy,
        }]
      });
    } else {
      if(gestureState.dy > this.props.closeSwipeThreshold && this._hasActivatedThreshold === false){
        this._hasActivatedThreshold = true;
      } else if(gestureState.dy <= this.props.closeSwipeThreshold && this._hasActivatedThreshold === true){
        this._hasActivatedThreshold = false;
      }

      this._movable.setNativeProps({
        style: [this.stylesheets.swiper, {
          top: -this.props.swipeOffset + this.props.offsetTop + gestureState.dy,
        }]
      });
    }
  };

  onPanResponderRelease = (evt, gestureState) => {
    if(this._hasActivatedThreshold){
      if(this.state.isOpen === false){
        this.state.positionTop.setValue(screen.height - this.props.swipeOffset + gestureState.dy);
        this.open();
      } else {
        this.state.positionTop.setValue(-this.props.swipeOffset + this.props.offsetTop + gestureState.dy);
        this.close();
      }
    } else {
      if(this.state.isOpen === false){
        this._movable.setNativeProps({
          style: [this.stylesheets.swiper, {
            top: this._initialPositionTop,
          }]
        });
      } else {
        this._movable.setNativeProps({
          style: [this.stylesheets.swiper, {
            top: -this.props.swipeOffset + this.props.offsetTop,
          }]
        });
      }
    }
  };

  open = () => {
    if(this.state.isAnimating){
      return;
    }

    this.setState({ isAnimating: true, isOpen: true });
    Animated.timing(
      this.state.positionTop, {
        toValue: -this.props.swipeOffset + this.props.offsetTop,
        duration: 500,
      }
    ).start(() => {
      this.setState({ isAnimating: false });
    })
  };

  close = () => {
    if(this.state.isAnimating){
      return;
    }

    this.setState({ isAnimating: true, isOpen: false });
    Animated.timing(
      this.state.positionTop, {
        toValue: this._initialPositionTop,
        duration: 500,
      }
    ).start(() => {
      this.setState({ isAnimating: false });
    })
  };

  getMovableStyle = () => {
    return [this.stylesheets.swiper, {
      top: this.state.positionTop,
    }]
  };

  constructor(props){
    super(props);
    this.initialize();
  }

  componentWillMount(){
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.onStartShouldSetPanResponder,
      onStartShouldSetPanResponderCapture: this.onStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this.onStartShouldSetPanResponder,
      onMoveShouldSetPanResponderCapture: this.onStartShouldSetPanResponder,
      onPanResponderMove: this.onPanResponderMove,
      onPanResponderRelease: this.onPanResponderRelease,
    })
  }
  render() {
    return (
      <View style={this.stylesheets.container}>
        <View style={this.stylesheets.content}>
          {this.props.children}
        </View>
        <Animated.View
          style={this.getMovableStyle()}
          ref={(ref) => this._movable = ref }
          {...this._panResponder.panHandlers}>
          <View style={this.stylesheets.innerBottom}>
            {this.props.content}
          </View>
        </Animated.View>
      </View>
    );
  }
}

export default VerticalSwipe;