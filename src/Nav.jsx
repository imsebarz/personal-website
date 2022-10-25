import React, { useState } from "react";
import "./assets/styles/nav.scss";

const Nav = () => {
  const [sideDisplay, setSideDisplay] = useState("-100%");
  const [isOpen, setIsOpen] = useState("closed");

  const toggleSidebar = () => {
    if (sideDisplay === "-100%") {
      setSideDisplay("0%");
      setIsOpen("open");
    } else {
      setSideDisplay("-100%");
      setIsOpen("closed");
    }
  };

  return (
    <nav className="nav">
      <a href="#">
        <h1>Sebarz</h1>
      </a>
      <ul className="nav-links">
        <li>
          {" "}
          <a href="#aboutme"> About me</a>
        </li>
        <li>
          {" "}
          <a href="#featuredProjects"> Featured</a>
        </li>
        <li>
          {" "}
          <a href="#mywork"> Projects</a>
        </li>
        <li>
          {" "}
          <a href="#contact"> Contact</a>
        </li>
        <a
          href="https://drive.google.com/file/d/11azWYcyX_1A0rx4mfCNuD9FddqPpIxU7/view?usp=sharing"
          target="_blank"
        >
          <button>Resume</button>
        </a>
      </ul>
      <div className={`hamburger ${isOpen}`} onClick={toggleSidebar}>
        <svg
          width="105"
          height="90"
          viewBox="0 0 105 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="hamburger">
            <path
              id="bottom"
              d="M10.5875 70.3995H94.5039C95.7861 70.3995 97.0558 70.6521 98.2405 71.1428C99.4251 71.6335 100.502 72.3527 101.408 73.2594C102.315 74.1661 103.034 75.2425 103.525 76.4271C104.016 77.6118 104.268 78.8815 104.268 80.1637C104.268 81.446 104.016 82.7157 103.525 83.9003C103.034 85.085 102.315 86.1614 101.408 87.0681C100.502 87.9748 99.4251 88.694 98.2405 89.1847C97.0558 89.6754 95.7861 89.928 94.5039 89.928H10.5875C9.30528 89.928 8.03558 89.6754 6.85093 89.1847C5.66628 88.694 4.58988 87.9748 3.68318 87.0681C2.77649 86.1614 2.05726 85.085 1.56656 83.9003C1.07586 82.7157 0.823303 81.446 0.823303 80.1637C0.823303 78.8815 1.07586 77.6118 1.56656 76.4271C2.05726 75.2425 2.77649 74.1661 3.68318 73.2594C4.58988 72.3527 5.66628 71.6335 6.85093 71.1428C8.03558 70.6521 9.30528 70.3995 10.5875 70.3995V70.3995Z"
              fill="#E9E9E9"
            />
            <path
              id="middle"
              d="M10.5875 35.267H94.5039C95.7861 35.267 97.0558 35.5195 98.2405 36.0102C99.4251 36.5009 100.502 37.2201 101.408 38.1268C102.315 39.0335 103.034 40.1099 103.525 41.2946C104.016 42.4792 104.268 43.7489 104.268 45.0312C104.268 46.3134 104.016 47.5832 103.525 48.7678C103.034 49.9525 102.315 51.0289 101.408 51.9355C100.502 52.8422 99.4251 53.5615 98.2405 54.0522C97.0558 54.5429 95.7861 54.7954 94.5039 54.7954H10.5875C9.30528 54.7954 8.03558 54.5429 6.85093 54.0522C5.66628 53.5615 4.58988 52.8422 3.68318 51.9355C2.77649 51.0289 2.05726 49.9525 1.56656 48.7678C1.07586 47.5832 0.823303 46.3134 0.823303 45.0312C0.823303 43.7489 1.07586 42.4792 1.56656 41.2946C2.05726 40.1099 2.77649 39.0335 3.68318 38.1268C4.58988 37.2201 5.66628 36.5009 6.85093 36.0102C8.03558 35.5195 9.30528 35.267 10.5875 35.267V35.267Z"
              fill="#E9E9E9"
            />
            <path
              id="top"
              d="M10.5875 0.138149H94.5039C97.0935 0.138149 99.5771 1.16688 101.408 2.99803C103.239 4.82918 104.268 7.31275 104.268 9.90238C104.268 12.492 103.239 14.9756 101.408 16.8067C99.5771 18.6379 97.0935 19.6666 94.5039 19.6666H10.5875C7.9979 19.6666 5.51433 18.6379 3.68318 16.8067C1.85203 14.9756 0.823303 12.492 0.823303 9.90238C0.823303 7.31275 1.85203 4.82918 3.68318 2.99803C5.51433 1.16688 7.9979 0.138149 10.5875 0.138149V0.138149Z"
              fill="#E9E9E9"
            />
          </g>
        </svg>
      </div>
      <aside className="sidebar" style={{ right: sideDisplay }}>
        <ul className="aside-links">
          <li>
            {" "}
            <a href="#aboutme"> About me</a>
          </li>
          <li>
            {" "}
            <a href="#featuredProjects"> Featured</a>
          </li>
          <li>
            {" "}
            <a href="#mywork"> Projects</a>
          </li>
          <li>
            {" "}
            <a href="#contact"> Contact</a>
          </li>
          <a
            href="https://drive.google.com/file/d/11azWYcyX_1A0rx4mfCNuD9FddqPpIxU7/view?usp=sharing"
            target="_blank"
          >
            <button>Resume</button>
          </a>
          <ul className="aside-social">
            <li>
              {" "}
              <a href="https://github.com/imsebarz" target="_blank">
                {" "}
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 25 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="Github">
                    <path
                      d="M12.5516 0.454773C5.92157 0.454773 0.551575 5.82477 0.551575 12.4548C0.551575 17.7648 3.98657 22.2498 8.75657 23.8398C9.35657 23.9448 9.58157 23.5848 9.58157 23.2698C9.58157 22.9848 9.56658 22.0398 9.56658 21.0348C6.55157 21.5898 5.77157 20.2998 5.53157 19.6248C5.39657 19.2798 4.81157 18.2148 4.30157 17.9298C3.88157 17.7048 3.28157 17.1498 4.28657 17.1348C5.23157 17.1198 5.90657 18.0048 6.13157 18.3648C7.21157 20.1798 8.93657 19.6698 9.62657 19.3548C9.73157 18.5748 10.0466 18.0498 10.3916 17.7498C7.72157 17.4498 4.93157 16.4148 4.93157 11.8248C4.93157 10.5198 5.39657 9.43977 6.16157 8.59977C6.04157 8.29977 5.62157 7.06977 6.28157 5.41977C6.28157 5.41977 7.28657 5.10477 9.58157 6.64977C10.5416 6.37977 11.5616 6.24477 12.5816 6.24477C13.6016 6.24477 14.6216 6.37977 15.5816 6.64977C17.8766 5.08977 18.8816 5.41977 18.8816 5.41977C19.5416 7.06977 19.1216 8.29977 19.0016 8.59977C19.7666 9.43977 20.2316 10.5048 20.2316 11.8248C20.2316 16.4298 17.4266 17.4498 14.7566 17.7498C15.1916 18.1248 15.5666 18.8448 15.5666 19.9698C15.5666 21.5748 15.5516 22.8648 15.5516 23.2698C15.5516 23.5848 15.7766 23.9598 16.3766 23.8398C18.7588 23.0355 20.8288 21.5045 22.2952 19.4621C23.7617 17.4198 24.5509 14.9691 24.5516 12.4548C24.5516 5.82477 19.1816 0.454773 12.5516 0.454773Z"
                      fill="black"
                    />
                  </g>
                </svg>
              </a>
            </li>
            <li>
              {" "}
              <a href="https://twitter.com/imsebarz" target="_blank">
                {" "}
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 23 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="Twitter">
                    <path
                      id="Vector"
                      d="M22.869 2.41503C22.034 2.78503 21.137 3.03503 20.194 3.14803C21.167 2.56582 21.8949 1.64949 22.242 0.570028C21.3278 1.11302 20.3273 1.49522 19.284 1.70003C18.5824 0.950893 17.653 0.454354 16.6403 0.287502C15.6276 0.12065 14.5881 0.29282 13.6832 0.777281C12.7784 1.26174 12.0588 2.03139 11.6361 2.96673C11.2135 3.90207 11.1115 4.95078 11.346 5.95003C9.49367 5.85702 7.68161 5.37558 6.02741 4.53693C4.37321 3.69829 2.91383 2.52119 1.74399 1.08203C1.34399 1.77203 1.11399 2.57203 1.11399 3.42403C1.11354 4.19102 1.30242 4.94627 1.66387 5.62276C2.02531 6.29925 2.54815 6.87607 3.18599 7.30203C2.44626 7.27849 1.72286 7.07861 1.07599 6.71903V6.77903C1.07591 7.85477 1.44802 8.89741 2.12917 9.73002C2.81032 10.5626 3.75856 11.134 4.81299 11.347C4.12677 11.5327 3.40732 11.5601 2.70899 11.427C3.00648 12.3526 3.58598 13.1621 4.36635 13.742C5.14673 14.3219 6.0889 14.6432 7.06099 14.661C5.41082 15.9564 3.37287 16.6591 1.27499 16.656C0.903368 16.6561 0.532063 16.6344 0.162987 16.591C2.29246 17.9602 4.77133 18.6868 7.30299 18.684C15.873 18.684 20.558 11.586 20.558 5.43003C20.558 5.23003 20.553 5.02803 20.544 4.82803C21.4553 4.169 22.2419 3.35292 22.867 2.41803L22.869 2.41503V2.41503Z"
                      fill="black"
                    />
                  </g>
                </svg>
              </a>
            </li>
            <li>
              {" "}
              <a href="https://www.linkedin.com/in/imsebarz/" target="_blank">
                {" "}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="LinkedIn">
                    <path
                      id="Vector"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2.7206e-07 1.838C2.7206e-07 1.35053 0.193646 0.883032 0.538338 0.53834C0.88303 0.193648 1.35053 2.45031e-06 1.838 2.45031e-06H20.16C20.4016 -0.000392101 20.6409 0.0468654 20.8641 0.139069C21.0874 0.231273 21.2903 0.366612 21.4612 0.537339C21.6322 0.708065 21.7677 0.910826 21.8602 1.13401C21.9526 1.3572 22.0001 1.59643 22 1.838V20.16C22.0003 20.4016 21.9529 20.6409 21.8606 20.8642C21.7683 21.0875 21.6328 21.2904 21.462 21.4613C21.2912 21.6322 21.0884 21.7678 20.8651 21.8602C20.6419 21.9526 20.4026 22.0001 20.161 22H1.838C1.59655 22 1.35746 21.9524 1.1344 21.86C0.911335 21.7676 0.708671 21.6321 0.537984 21.4613C0.367297 21.2905 0.231932 21.0878 0.139623 20.8647C0.0473133 20.6416 -0.000131096 20.4025 2.7206e-07 20.161V1.838ZM8.708 8.388H11.687V9.884C12.117 9.024 13.217 8.25 14.87 8.25C18.039 8.25 18.79 9.963 18.79 13.106V18.928H15.583V13.822C15.583 12.032 15.153 11.022 14.061 11.022C12.546 11.022 11.916 12.111 11.916 13.822V18.928H8.708V8.388ZM3.208 18.791H6.416V8.25H3.208V18.79V18.791ZM6.875 4.812C6.88105 5.08667 6.83217 5.35979 6.73124 5.61532C6.63031 5.87084 6.47935 6.10364 6.28723 6.30003C6.09511 6.49643 5.8657 6.65248 5.61246 6.75901C5.35921 6.86554 5.08724 6.92042 4.8125 6.92042C4.53776 6.92042 4.26579 6.86554 4.01255 6.75901C3.7593 6.65248 3.52989 6.49643 3.33777 6.30003C3.14565 6.10364 2.99469 5.87084 2.89376 5.61532C2.79283 5.35979 2.74395 5.08667 2.75 4.812C2.76187 4.27286 2.98439 3.75979 3.36989 3.38269C3.75539 3.00558 4.27322 2.79442 4.8125 2.79442C5.35178 2.79442 5.86961 3.00558 6.25512 3.38269C6.64062 3.75979 6.86313 4.27286 6.875 4.812V4.812Z"
                      fill="black"
                    />
                  </g>
                </svg>
              </a>
            </li>
            <li>
              {" "}
              <a href="https://www.instagram.com/imsebarz/" target="_blank">
                {" "}
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="Instagram">
                    <path
                      id="Vector"
                      d="M6.465 0.066C7.638 0.012 8.012 0 11 0C13.988 0 14.362 0.013 15.534 0.066C16.706 0.119 17.506 0.306 18.206 0.577C18.939 0.854 19.604 1.287 20.154 1.847C20.714 2.396 21.146 3.06 21.422 3.794C21.694 4.494 21.88 5.294 21.934 6.464C21.988 7.639 22 8.013 22 11C22 13.988 21.987 14.362 21.934 15.535C21.881 16.705 21.694 17.505 21.422 18.205C21.146 18.9391 20.7133 19.6042 20.154 20.154C19.604 20.714 18.939 21.146 18.206 21.422C17.506 21.694 16.706 21.88 15.536 21.934C14.362 21.988 13.988 22 11 22C8.012 22 7.638 21.987 6.465 21.934C5.295 21.881 4.495 21.694 3.795 21.422C3.06092 21.146 2.39582 20.7133 1.846 20.154C1.28638 19.6047 0.853315 18.9399 0.577 18.206C0.306 17.506 0.12 16.706 0.066 15.536C0.012 14.361 0 13.987 0 11C0 8.012 0.013 7.638 0.066 6.466C0.119 5.294 0.306 4.494 0.577 3.794C0.853723 3.06008 1.28712 2.39531 1.847 1.846C2.39604 1.2865 3.06047 0.853443 3.794 0.577C4.494 0.306 5.294 0.12 6.464 0.066H6.465ZM15.445 2.046C14.285 1.993 13.937 1.982 11 1.982C8.063 1.982 7.715 1.993 6.555 2.046C5.482 2.095 4.9 2.274 4.512 2.425C3.999 2.625 3.632 2.862 3.247 3.247C2.88205 3.60205 2.60118 4.03428 2.425 4.512C2.274 4.9 2.095 5.482 2.046 6.555C1.993 7.715 1.982 8.063 1.982 11C1.982 13.937 1.993 14.285 2.046 15.445C2.095 16.518 2.274 17.1 2.425 17.488C2.601 17.965 2.882 18.398 3.247 18.753C3.602 19.118 4.035 19.399 4.512 19.575C4.9 19.726 5.482 19.905 6.555 19.954C7.715 20.007 8.062 20.018 11 20.018C13.938 20.018 14.285 20.007 15.445 19.954C16.518 19.905 17.1 19.726 17.488 19.575C18.001 19.375 18.368 19.138 18.753 18.753C19.118 18.398 19.399 17.965 19.575 17.488C19.726 17.1 19.905 16.518 19.954 15.445C20.007 14.285 20.018 13.937 20.018 11C20.018 8.063 20.007 7.715 19.954 6.555C19.905 5.482 19.726 4.9 19.575 4.512C19.375 3.999 19.138 3.632 18.753 3.247C18.3979 2.88207 17.9657 2.60121 17.488 2.425C17.1 2.274 16.518 2.095 15.445 2.046V2.046ZM9.595 14.391C10.3797 14.7176 11.2534 14.7617 12.0669 14.5157C12.8805 14.2697 13.5834 13.7489 14.0556 13.0422C14.5278 12.3356 14.7401 11.4869 14.656 10.6411C14.572 9.79534 14.197 9.00497 13.595 8.405C13.2112 8.02148 12.7472 7.72781 12.2363 7.54515C11.7255 7.36248 11.1804 7.29536 10.6405 7.34862C10.1006 7.40187 9.57915 7.57418 9.1138 7.85313C8.64846 8.13208 8.25074 8.51074 7.9493 8.96185C7.64786 9.41296 7.45019 9.92529 7.37052 10.462C7.29084 10.9986 7.33115 11.5463 7.48854 12.0655C7.64593 12.5847 7.91648 13.0626 8.28072 13.4647C8.64496 13.8668 9.09382 14.1832 9.595 14.391ZM7.002 7.002C7.52702 6.47698 8.15032 6.0605 8.8363 5.77636C9.52228 5.49222 10.2575 5.34597 11 5.34597C11.7425 5.34597 12.4777 5.49222 13.1637 5.77636C13.8497 6.0605 14.473 6.47698 14.998 7.002C15.523 7.52702 15.9395 8.15032 16.2236 8.8363C16.5078 9.52228 16.654 10.2575 16.654 11C16.654 11.7425 16.5078 12.4777 16.2236 13.1637C15.9395 13.8497 15.523 14.473 14.998 14.998C13.9377 16.0583 12.4995 16.654 11 16.654C9.50046 16.654 8.06234 16.0583 7.002 14.998C5.94166 13.9377 5.34597 12.4995 5.34597 11C5.34597 9.50046 5.94166 8.06234 7.002 7.002V7.002ZM17.908 6.188C18.0381 6.06527 18.1423 5.91768 18.2143 5.75397C18.2863 5.59027 18.3248 5.41377 18.3274 5.23493C18.33 5.05609 18.2967 4.87855 18.2295 4.71281C18.1622 4.54707 18.0624 4.39651 17.936 4.27004C17.8095 4.14357 17.6589 4.04376 17.4932 3.97652C17.3275 3.90928 17.1499 3.87598 16.9711 3.87858C16.7922 3.88119 16.6157 3.91965 16.452 3.9917C16.2883 4.06374 16.1407 4.1679 16.018 4.298C15.7793 4.55103 15.6486 4.88712 15.6537 5.23493C15.6588 5.58274 15.7992 5.91488 16.0452 6.16084C16.2911 6.40681 16.6233 6.54723 16.9711 6.5523C17.3189 6.55737 17.655 6.42669 17.908 6.188V6.188Z"
                      fill="black"
                    />
                  </g>
                </svg>
              </a>
            </li>
            <li>
              {" "}
              <a href="https://www.behance.net/imsebarz" target="_blank">
                {" "}
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.63767 10.5084C9.85814 10.3487 9.96457 10.0852 9.96457 9.72281C9.97218 9.55049 9.9367 9.3807 9.86067 9.22612C9.79225 9.10194 9.69089 8.99804 9.56671 8.92455C9.43796 8.84647 9.29496 8.79479 9.14604 8.7725C8.98386 8.74209 8.81914 8.72689 8.65695 8.72942H6.87544V10.7491H8.80393C9.13591 10.7517 9.4172 10.6706 9.63767 10.5084V10.5084ZM9.9367 12.333C9.68835 12.1429 9.35638 12.0492 8.94331 12.0492H6.87038V14.4313H8.90276C9.09283 14.4313 9.26768 14.4135 9.43747 14.378C9.59811 14.3466 9.75124 14.2847 9.88855 14.1956C10.0178 14.112 10.1217 13.9979 10.2002 13.8509C10.2763 13.704 10.3143 13.5164 10.3143 13.2909C10.3143 12.8423 10.1876 12.5256 9.9367 12.333V12.333ZM11.9615 0.212143C5.692 0.212143 0.60849 5.29565 0.60849 11.5651C0.60849 17.8346 5.692 22.9181 11.9615 22.9181C18.231 22.9181 23.3145 17.8346 23.3145 11.5651C23.3145 5.29565 18.231 0.212143 11.9615 0.212143ZM14.1535 7.48262H17.6608V8.33663H14.1535V7.48262ZM11.9615 14.525C11.7974 14.8364 11.5632 15.1054 11.2773 15.3106C10.9782 15.5184 10.6463 15.6705 10.294 15.7592C9.92548 15.8579 9.54531 15.9065 9.16378 15.9036H4.96723V7.25962H9.04721C9.46028 7.25962 9.83533 7.29763 10.1774 7.36858C10.517 7.43954 10.8059 7.56118 11.0492 7.7259C11.2899 7.89062 11.48 8.11109 11.6143 8.38478C11.7461 8.65593 11.8145 8.99551 11.8145 9.39844C11.8145 9.83431 11.7157 10.1942 11.518 10.4856C11.3178 10.777 11.0289 11.0127 10.6361 11.1977C11.1708 11.3497 11.5636 11.6209 11.8221 12.001C12.0857 12.3862 12.2149 12.8474 12.2149 13.3897C12.2149 13.8307 12.1313 14.2083 11.9615 14.525ZM19.0267 13.187H14.5058C14.5058 13.6786 14.6756 14.15 14.9315 14.4034C15.19 14.6543 15.56 14.781 16.044 14.781C16.3937 14.781 16.6902 14.6923 16.9436 14.5174C17.1945 14.3426 17.3466 14.1576 17.4023 13.965H18.9177C18.6744 14.7176 18.3045 15.2549 17.8027 15.5792C17.306 15.9036 16.6978 16.0658 15.9908 16.0658C15.4966 16.0658 15.0531 15.9847 14.6553 15.8301C14.2726 15.6806 13.928 15.4525 13.6442 15.1586C13.3643 14.8567 13.148 14.5016 13.0081 14.1145C12.8535 13.6862 12.7775 13.2351 12.7825 12.7815C12.7825 12.3127 12.8611 11.8768 13.0132 11.4714C13.3046 10.6833 13.9102 10.0522 14.6832 9.72534C15.0962 9.55302 15.5397 9.46686 15.9883 9.47193C16.5204 9.47193 16.9816 9.5733 17.382 9.7811C17.7675 9.97952 18.1022 10.2639 18.3602 10.6123C18.6162 10.9595 18.7961 11.3548 18.9101 11.8008C19.0191 12.2392 19.0571 12.7004 19.0267 13.187V13.187ZM15.935 10.7643C15.6613 10.7643 15.4307 10.8125 15.2533 10.9063C15.076 11 14.929 11.1166 14.8175 11.2509C14.7113 11.3806 14.6328 11.5307 14.5869 11.6918C14.5463 11.8262 14.5184 11.963 14.5083 12.1024H17.3085C17.268 11.664 17.1159 11.3396 16.9132 11.1115C16.7003 10.886 16.3582 10.7643 15.935 10.7643V10.7643Z"
                    fill="black"
                  />
                </svg>
              </a>
            </li>
          </ul>
        </ul>
      </aside>
    </nav>
  );
};

export default Nav;
