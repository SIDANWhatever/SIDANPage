import "./nav.css";
import Theme from "./icons/Theme";
import Sidan from "./icons/Sidan";
import { useSelector, useDispatch } from "react-redux";
import { lightTheme, darkTheme } from "../../features/theme/themeSlice";

const Nav = (props) => {
  const theme = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();

  const changeTheme = () => {
    if (theme == "dark") {
      dispatch(lightTheme());
    } else {
      dispatch(darkTheme());
    }
  };

  return (
    <div className="n">
      <div className="n-box">
        <a onClick={() => changeTheme()} className="n-link">
          <Theme />
        </a>
      </div>
      <div className="n-box">
        <p>Services</p>
      </div>
      <div className="n-box">
        <p> Cardano</p>
      </div>
      <div className="n-box" onClick={() => props.navigatePage("/")}>
        <Sidan />
      </div>
    </div>
  );
};

export default Nav;
