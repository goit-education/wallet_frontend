import React, { Component } from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Table from '../Table/Table';
import Chart from '../Chart/Chart';
import styles from './DiagramTab.module.css';

const pickColor = state => state.data.datasets[0].backgroundColor;

const colors = [
  '#ecb22a',
  '#e28b20',
  '#d25925',
  '#67b7d0',
  '#5593d7',
  '#3e6ba8',
  '#9cc254',
  '#73ad57',
  '#507c3a',
];

const calendarMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

class DiagramTab extends Component {
  static propTypes = {
    finance: PropTypes.shape({
      data: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
  };

  state = {
    expenses: [],
    income: [],
    statistics: [],
    currentYear: Number(moment(moment()).format('YYYY')),
    currentMonth: moment(moment()).format('MMMM'),
    month: [{ label: 'All months', value: '' }],
    year: [{ label: 'All years', value: 0 }],
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: colors,
          color: ['#ffffff'],
        },
      ],
    },
  };

  componentDidMount = () => {
    const { finance } = this.props;
    const { currentMonth, currentYear } = this.state;

    const allExpenses = this.filterTransactions(finance.data, 'expense');
    const allIncome = this.filterTransactions(finance.data, 'income');

    this.setState({ expenses: allExpenses, income: allIncome });

    this.sortTransactions(finance.data, currentMonth, currentYear);

    const years = finance.data
      .map(trans =>
        Number(moment(Date.parse(trans.transactionDate)).format('YYYY')),
      )
      .sort();

    const months = finance.data.map(trans =>
      moment(Date.parse(trans.transactionDate)).format('MMMM'),
    );

    years.forEach((year, idx) =>
      years.indexOf(year) === idx
        ? this.setState(prevState => ({
            year: [...prevState.year, { label: year, value: year }],
          }))
        : null,
    );

    calendarMonths.forEach(calendarMonth => {
      months.forEach((month, idx) =>
        calendarMonth === month && months.indexOf(month) === idx
          ? this.setState(prevState => ({
              month: [
                ...prevState.month,
                { label: calendarMonth, value: calendarMonth },
              ],
            }))
          : null,
      );
    });
  };

  componentDidUpdate = (prevProps, prevState) => {
    const { currentYear, currentMonth, statistics } = this.state;
    const { finance } = this.props;

    if (prevState.statistics !== statistics) {
      this.filterStatistics();
    }

    if (
      currentMonth !== prevState.currentMonth ||
      currentYear !== prevState.currentYear
    ) {
      this.sortTransactions(finance.data, currentMonth, currentYear);
    }
  };

  filterTransactions = (transaction, type) =>
    transaction.filter(trans => trans.type === type);

  getTotal = expenses =>
    expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

  formStatistics = costs => {
    let counter = 0;
    const arr = [];
    Object.keys(costs).forEach(key => {
      arr.push({
        id: counter,
        category: key,
        amount: costs[key],
        color: pickColor(this.state)[counter],
      });
      counter += 1;
    });

    this.setState({ statistics: arr });
  };

  filterStatistics = () => {
    const { statistics } = this.state;

    const categories = statistics.map(el => el.category);
    const costs = statistics.map(el => el.amount);

    const stateCopy = { ...this.state };

    stateCopy.data.datasets[0].data = costs;

    this.setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        labels: categories,
        datasets: [...stateCopy.data.datasets],
      },
    }));
  };

  sortTransactions(transactions, currentMonth, currentYear) {
    const sorted = transactions.filter(trans => {
      const date = moment(Date.parse(trans.transactionDate)).format(
        'YYYY MMMM',
      );
      const byMonth = date.includes(currentMonth);
      const byYear = date.includes(currentYear);
      return byMonth && byYear;
    });

    const allExpenses = this.filterTransactions(sorted, 'expense');
    const allIncome = this.filterTransactions(sorted, 'income');

    this.setState({ expenses: allExpenses, income: allIncome });

    const totalCosts = this.getTotal(allExpenses);

    return this.formStatistics(totalCosts);
  }

  handleChange = ({ value }) => {
    this.setState(prevState => ({
      currentMonth: typeof value === 'string' ? value : prevState.currentMonth,
      currentYear: typeof value !== 'string' ? value : prevState.currentYear,
    }));
  };

  getSum = transaction =>
    transaction.reduce((acc, trans) => acc + trans.amount, 0);

  render() {
    const {
      diagram,
      chartBlock,
      chartBlockHeader,
      diagramHeader,
      wrapper,
    } = styles;

    const {
      data,
      statistics,
      income,
      year,
      month,
      currentYear,
      currentMonth,
    } = this.state;

    return (
      <div className={diagram}>
        <div className={diagramHeader}>
          <h2>Statistics</h2>
        </div>
        <div className={wrapper}>
          <div className={chartBlock}>
            <div className={chartBlockHeader}>
              <h2>Statistics</h2>
            </div>

            {statistics.length > 0 ? (
              <Chart data={data} />
            ) : (
              'No transactions during this period'
            )}
          </div>

          <Table
            year={year}
            month={month}
            data={statistics}
            handleChange={this.handleChange}
            expenses={this.getSum(statistics)}
            income={this.getSum(income)}
            currentYear={currentYear}
            currentMonth={currentMonth}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  finance: state.finance,
});

export default connect(mapStateToProps)(DiagramTab);
